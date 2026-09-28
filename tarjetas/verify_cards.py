import pymupdf, cv2, numpy as np, os, glob

OUT = "verify"
os.makedirs(OUT, exist_ok=True)
det = cv2.QRCodeDetector()
report = []

for pdf_path in sorted(glob.glob("print/*.pdf")):
    name = os.path.splitext(os.path.basename(pdf_path))[0]
    doc = pymupdf.open(pdf_path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(4, 4))  # ~288dpi, nitido para el QR
        png_path = os.path.join(OUT, f"{name}_p{i}.png")
        pix.save(png_path)
        img = cv2.imread(png_path)
        data, points, _ = det.detectAndDecode(img)
        report.append((name, i, data or "(no se detecto QR en esta pagina)"))
    doc.close()

for name, i, data in report:
    print(f"{name} pag{i}: {data}")
