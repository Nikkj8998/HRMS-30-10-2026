from fpdf import FPDF
import base64

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=24)
pdf.cell(200, 50, txt="Sample Document", ln=1, align='C')
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="This is a system-generated sample document.", ln=1, align='C')
pdf.cell(200, 10, txt="Please upload a real document to replace this.", ln=1, align='C')

pdf.output("sample.pdf")

with open("sample.pdf", "rb") as pdf_file:
    encoded_string = base64.b64encode(pdf_file.read()).decode('utf-8')
    with open("b64.txt", "w") as out:
        out.write("data:application/pdf;base64," + encoded_string)
