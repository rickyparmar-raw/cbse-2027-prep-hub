#!/usr/bin/env python3
"""Parse PYQ chapter markdown -> quiz_data.json (clean auto-gradable MCQs only)."""
import os, re, json
BASE = os.path.expanduser("~/Desktop/CBSE_2027_Prediction")
SRC  = f"{BASE}/PYQ_Chapters"
SUBJ = {"Physics":"⚛️","Chemistry":"🧪","Mathematics":"📐","Physical_Education":"🏃"}
LETTERS = {'a':0,'b':1,'c':2,'d':3}

def parse_chapter(md):
    txt = open(md, encoding="utf-8").read()
    # split body vs answer key
    parts = re.split(r'^##\s*Answer Key\s*$', txt, flags=re.M)
    if len(parts) < 2: return []
    body, key = parts[0], parts[1]
    # --- answers: "**Q3.** (a)" or "**Q3:** (a)" -> {3:'a'}
    answers = {}
    for m in re.finditer(r'\*\*Q(\d+)[.:]\*\*\s*\(([a-dA-D])\)', key):
        answers[int(m.group(1))] = m.group(2).lower()
    AR_OPTS = [
        "Both A and R are true and R is the correct explanation of A",
        "Both A and R are true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
    ]
    out = []
    blocks = re.split(r'(?=\*\*Q\d+\.\*\*)', body)
    for b in blocks:
        qm = re.match(r'\*\*Q(\d+)\.\*\*\s*(.+)', b, re.S)
        if not qm: continue
        qn = int(qm.group(1))
        if qn not in answers: continue          # only keep if we have a clean lettered answer
        correct = LETTERS[answers[qn]]
        # case 1: explicit 4-option MCQ
        opts = {}
        for om in re.finditer(r'\n\(([a-d])\)\s*(.+?)(?=\n\([a-d]\)|\n\[|\n\*\*|\Z)', b, re.S):
            opts[om.group(1)] = re.sub(r'\s+', ' ', om.group(2)).strip()
        if len(opts) == 4:
            qtext = re.sub(r'\s+',' ', qm.group(2).split('\n(a)')[0]).strip()
            out.append({"q": qtext, "opts":[opts['a'],opts['b'],opts['c'],opts['d']], "correct": correct, "type":"mcq"})
            continue
        # case 2: Assertion-Reason -> standard CBSE options (universal, not fabricated)
        if re.search(r'Assertion\s*\(A\)', b) and re.search(r'Reason\s*\(R\)', b):
            qtext = re.sub(r'\[(PYQ|Practice)[^\]]*\][^\n]*','',qm.group(2))
            qtext = re.sub(r'(Very High|High|Medium)\s*$','', re.sub(r'\s+',' ',qtext)).strip()
            out.append({"q": qtext, "opts": AR_OPTS, "correct": correct, "type":"ar"})
    return out

def main():
    data = {}
    for subj in SUBJ:
        d = f"{SRC}/{subj}"
        if not os.path.isdir(d): continue
        chapters = []
        for fn in sorted(os.listdir(d)):
            if not fn.endswith(".md"): continue
            qs = parse_chapter(f"{d}/{fn}")
            if not qs: continue
            m = re.match(r'(Ch|Unit)(\d+)_(.+)\.md', fn)
            title = f"{m.group(1)} {int(m.group(2))} · {m.group(3).replace('_',' ')}" if m else fn[:-3]
            chapters.append({"title": title, "questions": qs})
        data[subj] = {"icon": SUBJ[subj], "chapters": chapters}
    json.dump(data, open(f"{BASE}/Website/quiz_data.json","w"), ensure_ascii=False)
    tot = sum(len(c["questions"]) for s in data.values() for c in s["chapters"])
    print(f"quiz_data.json: {tot} MCQs across {sum(len(s['chapters']) for s in data.values())} chapters")
    for s,v in data.items():
        n=sum(len(c['questions']) for c in v['chapters'])
        print(f"  {s}: {n} MCQs in {len(v['chapters'])} chapters")

if __name__=="__main__": main()
