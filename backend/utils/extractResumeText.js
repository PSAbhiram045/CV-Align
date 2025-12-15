import { extractTextFromPDF } from "./pdfExtractor.js";
import { extractTextFromDOCX } from "./docxExtractor.js";

export const extractResumeText = async (filePath) => {
    const ext = filePath.split(".").pop().toLowerCase();

    if (ext === "pdf") {
        return await extractTextFromPDF(filePath);
    }

    if (ext === "docx") {
        return await extractTextFromDOCX(filePath);
    }

    throw new Error("Unsupported resume format");
};
