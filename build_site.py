#!/usr/bin/env python3
"""Scan all PDF content, copy into Website/assets, emit manifest.json."""
import os, json, shutil, re
BASE = os.path.expanduser("~/Desktop/CBSE_2027_Prediction")
WEB  = f"{BASE}/Website"
ASSET= f"{WEB}/assets"

SUBJECTS = ["Physics","Chemistry","Mathematics","Physical_Education"]
PRETTY   = {"Physics":"Physics","Chemistry":"Chemistry","Mathematics":"Maths","Physical_Education":"Physical Education"}
ICON     = {"Physics":"⚛️","Chemistry":"🧪","Mathematics":"📐","Physical_Education":"🏃"}

def chap_num(name):
    m = re.search(r'(?:Ch|Unit)(\d+)', name)
    return int(m.group(1)) if m else 999

def nice(name):
    # Ch01_Electric_Charges_and_Fields -> "Ch 1 · Electric Charges and Fields"
    m = re.match(r'(Ch|Unit)(\d+)_(.+)', name)
    if m:
        kind = "Ch" if m.group(1)=="Ch" else "Unit"
        return f"{kind} {int(m.group(2))} · {m.group(3).replace('_',' ')}"
    return name.replace('_',' ')

def copy_pdf(src, rel):
    dst = f"{ASSET}/{rel}"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    return f"assets/{rel}", os.path.getsize(src)

def info_title(fn):
    # 01_The_Last_Lesson.png -> "The Last Lesson"
    m = re.match(r'(\d+)_(.+)\.png', fn)
    return m.group(2).replace('_',' ') if m else fn[:-4].replace('_',' ')
def info_order(fn):
    m = re.match(r'(\d+)_', fn)
    return int(m.group(1)) if m else 999

def main():
    if os.path.isdir(ASSET): shutil.rmtree(ASSET)
    os.makedirs(ASSET, exist_ok=True)
    manifest = {"subjects": {}, "extras": {}}

    for subj in SUBJECTS:
        entry = {"pretty": PRETTY[subj], "icon": ICON[subj], "pyq": [], "final": [], "halfyearly": []}
        # PYQ chapters
        d = f"{BASE}/PDF_PYQ_Chapters/{subj}"
        if os.path.isdir(d):
            for fn in sorted(os.listdir(d), key=chap_num):
                if fn.endswith(".pdf"):
                    path,size = copy_pdf(f"{d}/{fn}", f"pyq/{subj}/{fn}")
                    entry["pyq"].append({"title": nice(fn[:-4]), "path": path, "size": size})
        # Final predicted papers
        d = f"{BASE}/PDF_Papers/{subj}"
        if os.path.isdir(d):
            for fn in sorted(os.listdir(d)):
                if fn.endswith(".pdf"):
                    path,size = copy_pdf(f"{d}/{fn}", f"final/{subj}/{fn}")
                    setn = re.search(r'Set(\d+)', fn)
                    entry["final"].append({"title": f"Set {int(setn.group(1))}" if setn else fn[:-4], "path": path, "size": size})
        # Half-yearly
        d = f"{BASE}/PDF_Half_Yearly"
        HY_PREFIX = {"Physics":"Physics","Chemistry":"Chemistry","Mathematics":"Maths","Physical_Education":"Pe"}
        if os.path.isdir(d):
            pref = HY_PREFIX[subj] + "_"
            for fn in sorted(os.listdir(d)):
                if fn.startswith(pref) and fn.endswith(".pdf"):
                    path,size = copy_pdf(f"{d}/{fn}", f"halfyearly/{fn}")
                    setn = re.search(r'Set(\d+)', fn)
                    entry["halfyearly"].append({"title": f"Set {int(setn.group(1))}" if setn else fn[:-4], "path": path, "size": size})
        manifest["subjects"][subj] = entry

    # Extras: formula sheets + class notes
    fs=[]
    d=f"{BASE}/PDF_Formula_Sheets"
    if os.path.isdir(d):
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".pdf"):
                path,size=copy_pdf(f"{d}/{fn}", f"formula/{fn}")
                fs.append({"title": fn[:-4].replace('_',' '), "path": path, "size": size})
    notes=[]
    d=f"{BASE}/PDF Class Notes"
    if os.path.isdir(d):
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".pdf"):
                path,size=copy_pdf(f"{d}/{fn}", f"notes/{fn}")
                notes.append({"title": fn[:-4].replace('_',' '), "path": path, "size": size})
    manifest["extras"]={"formula": fs, "notes": notes}

    # English chapter infographics (PNG visual study-maps)
    info=[]
    d=f"{BASE}/Infographics_English"
    if os.path.isdir(d):
        for fn in sorted(os.listdir(d), key=info_order):
            if fn.endswith(".png"):
                path,size=copy_pdf(f"{d}/{fn}", f"infographics/{fn}")
                info.append({"title": info_title(fn), "path": path, "size": size})
    manifest["extras"]["infographics"]=info

    # counts
    tot_pyq=sum(len(s["pyq"]) for s in manifest["subjects"].values())
    tot_fin=sum(len(s["final"]) for s in manifest["subjects"].values())
    tot_hy =sum(len(s["halfyearly"]) for s in manifest["subjects"].values())
    manifest["stats"]={"pyq":tot_pyq,"final":tot_fin,"halfyearly":tot_hy,"formula":len(fs),"notes":len(notes),"infographics":len(info)}

    json.dump(manifest, open(f"{WEB}/manifest.json","w"), indent=1)
    print(f"manifest: pyq={tot_pyq} final={tot_fin} halfyearly={tot_hy} formula={len(fs)} notes={len(notes)} infographics={len(info)}")

if __name__=="__main__": main()
