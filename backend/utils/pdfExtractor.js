import pdfParse from "pdf-parse";
import fs from "fs";

export const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("PDF extraction error:", error);
        throw new Error("Failed to extract text from PDF");
    }
};
