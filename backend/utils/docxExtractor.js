import mammoth from "mammoth";

export const extractTextFromDOCX = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error("DOCX extraction error:", error);
        throw new Error("Failed to extract text from DOCX");
    }
};
