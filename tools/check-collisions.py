#!/usr/bin/env python3
"""
Apps Script 이름 충돌 검사.

왜 필요한가 — Apps Script 는 프로젝트 안의 모든 .js/.gs 를 하나의 전역 스코프에 올린다.
같은 이름의 함수가 두 파일에 있으면 나중에 로드된 쪽이 조용히 이긴다. 오류도 경고도 없다.
여러 사람이 같은 프로젝트를 고칠 때 이 방식으로 기능이 통째로 사라진다.
(2026-09-09 실제로 doGet 과 healthCheck 두 건이 겹쳤다)

  python3 tools/check-collisions.py [디렉터리]

충돌이 있으면 종료 코드 1.
"""
import re, sys, glob, os
from collections import defaultdict

def strip_noise(src):
    """문자열·주석·정규식을 공백으로 바꿔 중괄호 깊이를 정확히 세게 한다."""
    out = []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i+1] == '/':
            j = src.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j
        elif c == '/' and i + 1 < n and src[i+1] == '*':
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', src[i:j])); i = j
        elif c in '"\'`':
            q = c; j = i + 1
            while j < n:
                if src[j] == '\\': j += 2; continue
                if src[j] == q: j += 1; break
                j += 1
            out.append(re.sub(r'[^\n]', ' ', src[i:j])); i = j
        else:
            out.append(c); i += 1
    return ''.join(out)

DECL = re.compile(r'\b(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=|class\s+([A-Za-z_$][\w$]*))')

def top_level_names(path):
    src = strip_noise(open(path, encoding='utf-8').read())
    names, depth, i, n = [], 0, 0, len(src)
    line = 1
    while i < n:
        ch = src[i]
        if ch == '\n': line += 1
        elif ch == '{': depth += 1
        elif ch == '}': depth = max(0, depth - 1)
        elif depth == 0:
            m = DECL.match(src, i)
            if m:
                nm = m.group(1) or m.group(2) or m.group(3)
                names.append((nm, line))
                i = m.end(); continue
        i += 1
    return names

def main():
    root = sys.argv[1] if len(sys.argv) > 1 else 'apps-script'
    files = sorted(glob.glob(os.path.join(root, '*.js')) + glob.glob(os.path.join(root, '*.gs')))
    if not files:
        print(f'검사할 파일이 없습니다: {root}/*.js'); return 0

    seen = defaultdict(list)
    for f in files:
        for nm, ln in top_level_names(f):
            seen[nm].append((os.path.basename(f), ln))

    dups = {k: v for k, v in seen.items() if len(v) > 1}
    total = sum(len(top_level_names(f)) for f in files)
    print(f'파일 {len(files)}개 · 최상위 이름 {total}개 검사')

    if not dups:
        print('✅ 이름 충돌 없음')
        return 0

    print(f'\n🔴 이름 충돌 {len(dups)}건 — Apps Script 는 나중 정의가 조용히 이깁니다\n')
    for nm, places in sorted(dups.items()):
        print(f'  {nm}')
        for fn, ln in places:
            print(f'      {fn}:{ln}')
    print('\n한쪽 이름을 바꾸세요. 그대로 두면 한쪽 기능이 통째로 사라집니다.')
    return 1

if __name__ == '__main__':
    sys.exit(main())
