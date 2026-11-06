#!/usr/bin/env python3
# clean.py — Kiểm tra nguồn nào chết/chuyển hướng trong registry gốc.
#
# Ý tưởng mượn từ clean.py của lethituyen (vbooks-extension_lethituyen),
# viết lại gọn bằng Python stdlib (urllib, không cần requests):
#   - KHÔNG hardcode đường dẫn tuyệt đối, KHÔNG hardcode đường dẫn Windows.
#   - Mặc định CHỈ BÁO CÁO, không xóa gì cả.
#   - Cờ --prune: liệt kê thư mục sẽ xóa, vẫn KHÔNG xóa.
#   - Chỉ khi có cả --prune --confirm mới thật sự xóa thư mục chết và
#     cập nhật lại plugin.json gốc (bỏ các entry đã chết).
#
# Cách dùng:
#   python3 scripts/clean.py [đường-dẫn-repo]
#   python3 scripts/clean.py --prune [đường-dẫn-repo]
#   python3 scripts/clean.py --prune --confirm [đường-dẫn-repo]
#   python3 scripts/clean.py --help
#
# Mặc định thư mục repo là thư mục cha của scripts/ (tức root repo).
# Mỗi entry được kiểm tra bằng HTTP HEAD (rớt thì thử GET) tới `source`,
# timeout 10 giây. Exit 0 khi mọi nguồn còn sống (hoặc đã dọn xong với
# --confirm), exit 1 khi còn nguồn chết chưa được dọn.

import argparse
import json
import os
import shutil
import sys
import urllib.error
import urllib.request

TIMEOUT = 10
USER_AGENT = "Mozilla/5.0 (compatible; Qsang_vbook-clean/1.0)"


def repo_default():
    # scripts/ nằm ngay dưới root repo -> cha của thư mục chứa file này.
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def entry_folder(repo, entry):
    """Suy ra thư mục nguồn trên đĩa từ path trong registry.

    path dạng:
      https://raw.githubusercontent.com/qsang2025/Qsang_vbook/main/extensions/<loại>/<tên>/plugin.zip
    -> extensions/<loại>/<tên>
    """
    raw_path = (entry.get("path") or "").strip()
    marker = "/extensions/"
    if marker in raw_path:
        rel = raw_path.split(marker, 1)[1]
        if rel.endswith("/plugin.zip"):
            rel = rel[: -len("/plugin.zip")]
        return os.path.join(repo, "extensions", rel)
    # Dự phòng: tìm theo tên nguồn.
    name = (entry.get("name") or "").strip()
    if name:
        for type_dir in ("novel", "comic", "chinese_novel", "video",
                         "audio", "translate", "tts", "ai"):
            cand = os.path.join(repo, "extensions", type_dir, name)
            if os.path.isdir(cand):
                return cand
    return None


def check_source(url):
    """Trả về (trạng_thái, ghi_chú).

    Trạng thái: "alive" (còn sống), "moved" (chuyển hướng sang URL khác),
    "dead" (chết/lỗi).
    """
    req = urllib.request.Request(url, method="HEAD",
                                 headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            final = resp.geturl()
            if resp.status < 400:
                if final.rstrip("/") != url.rstrip("/"):
                    return "moved", "chuyển hướng sang %s (HTTP %s)" % (final, resp.status)
                return "alive", "HTTP %s" % resp.status
            return "dead", "HTTP %s" % resp.status
    except urllib.error.HTTPError as e:
        # Một số site chặn HEAD (405/403/501) nhưng GET vẫn chạy -> thử GET.
        if e.code in (400, 403, 405, 501):
            return check_source_get(url)
        return "dead", "HTTP %s" % e.code
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        reason = getattr(e, "reason", e)
        return "dead", "không kết nối được: %s" % reason


def check_source_get(url):
    req = urllib.request.Request(url, method="GET",
                                 headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            final = resp.geturl()
            if resp.status < 400:
                if final.rstrip("/") != url.rstrip("/"):
                    return "moved", "chuyển hướng sang %s (HTTP %s)" % (final, resp.status)
                return "alive", "HTTP %s" % resp.status
            return "dead", "HTTP %s" % resp.status
    except urllib.error.HTTPError as e:
        return "dead", "HTTP %s" % e.code
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        reason = getattr(e, "reason", e)
        return "dead", "không kết nối được: %s" % reason


def main():
    parser = argparse.ArgumentParser(
        description="Kiểm tra nguồn nào chết/chuyển hướng trong plugin.json gốc "
                    "(chỉ báo cáo, không tự xóa).")
    parser.add_argument("repo", nargs="?", default=None,
                        help="đường dẫn repo (mặc định: thư mục cha của scripts/)")
    parser.add_argument("--prune", action="store_true",
                        help="liệt kê thư mục của các nguồn chết (vẫn KHÔNG xóa)")
    parser.add_argument("--confirm", action="store_true",
                        help="xóa thật (chỉ có tác dụng khi đi kèm --prune)")
    args = parser.parse_args()

    repo = os.path.abspath(args.repo) if args.repo else repo_default()
    registry_path = os.path.join(repo, "plugin.json")
    if not os.path.isfile(registry_path):
        print("LỖI: không tìm thấy plugin.json trong %s — sai đường dẫn repo?" % repo,
              file=sys.stderr)
        return 1
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
    except (OSError, ValueError) as e:
        print("LỖI: plugin.json không đọc được: %s" % e, file=sys.stderr)
        return 1
    entries = registry.get("data") or []
    if not entries:
        print("Registry chưa có nguồn nào — không có gì để kiểm tra.")
        return 0

    alive, moved, dead = [], [], []
    for entry in entries:
        name = entry.get("name") or "?"
        source = (entry.get("source") or "").strip()
        if not source:
            print("%s: thiếu trường source, bỏ qua." % name)
            continue
        status, note = check_source(source)
        if status == "alive":
            print("%s: %s OK (%s)" % (name, source, note))
            alive.append(entry)
        elif status == "moved":
            print("%s: %s CHUYỂN HƯỚNG — %s" % (name, source, note))
            moved.append(entry)
        else:
            print("%s: %s CHẾT — %s" % (name, source, note))
            dead.append(entry)

    print("\nTổng kết: %d sống, %d chuyển hướng, %d chết (tổng %d nguồn)."
          % (len(alive), len(moved), len(dead), len(entries)))

    if not dead:
        return 0

    if args.prune:
        print("\nThư mục sẽ xóa (--prune):")
        for entry in dead:
            folder = entry_folder(repo, entry)
            print("  - %s (%s)" % (entry.get("name") or "?",
                                    os.path.relpath(folder, repo) if folder else "không xác định được thư mục"))
        if not args.confirm:
            print("Chưa xóa gì cả. Muốn xóa thật, chạy lại với --prune --confirm.")
            return 1
        # --prune --confirm: xóa thư mục chết + cập nhật registry.
        removed = []
        for entry in dead:
            folder = entry_folder(repo, entry)
            if folder and os.path.isdir(folder):
                shutil.rmtree(folder)
                removed.append(os.path.relpath(folder, repo))
        registry["data"] = alive + moved
        with open(registry_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("Đã xóa %d thư mục: %s" % (len(removed), ", ".join(removed) or "không có"))
        print("Đã cập nhật plugin.json, còn %d nguồn." % len(registry["data"]))
        return 0

    if args.confirm and not args.prune:
        print("Cờ --confirm chỉ có tác dụng khi đi kèm --prune. Chưa xóa gì cả.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
