import { ExtractedDocumentData } from '../../interfaces/document.types';

export class VietnameseParser {
    /**
     * Specialized Rule-based & Heuristics Regex parser for Vietnamese identity documents
     * @param texts Array of recognized text strings ordered from top to bottom, left to right
     */
    public static parseVietnameseIdCard(texts: string[]): Partial<ExtractedDocumentData> {
        const result: Partial<ExtractedDocumentData> = {
            idNumber: '',
            fullName: '',
            dateOfBirth: '',
            gender: '',
            nationality: '',
            hometown: '',
            residence: '',
            expiryDate: '',
            documentType: 'UNKNOWN'
        };

        const joinedText = texts.join('\n');
        
        // 1. Identify document type
        if (joinedText.includes('CĂN CƯỚC CÔNG DÂN') || joinedText.includes('CAN CUOC CONG DAN') || joinedText.includes('CĂN CƯỚC') || joinedText.includes('CAN CUOC')) {
            if (joinedText.includes('Chip') || joinedText.includes('CHIP') || joinedText.includes('Có giá trị đến') || joinedText.includes('CO GIA TRI DEN')) {
                result.documentType = 'CCCD_CHIP';
            } else {
                result.documentType = 'CCCD_CODE'; // Old barcode ID card
            }
        } else if (joinedText.includes('GIẤY PHÉP LÁI XE') || joinedText.includes('GIAY PHEP LAI XE')) {
            result.documentType = 'GPLX';
        } else if (joinedText.includes('CHỨNG MINH NHÂN DÂN') || joinedText.includes('CHUNG MINH NHAN DAN')) {
            result.documentType = 'CMND_9_12';
        }

        // 2. Extract ID number (9 or 12 consecutive digits)
        const idRegex = /\b(\d{9}|\d{12})\b/;
        const idMatch = joinedText.match(idRegex);
        if (idMatch) {
            result.idNumber = idMatch[1];
        } else {
            // Handle cases where Driver's License or ID has spaced numbers
            for (const text of texts) {
                const cleanText = text.replace(/\s+/g, '');
                const m = cleanText.match(/\b(\d{12}|\d{9})\b/);
                if (m) {
                    result.idNumber = m[1];
                    break;
                }
            }
        }

        // 3. Extract Date of Birth (dd/mm/yyyy)
        const birthDateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;
        const birthDateMatch = joinedText.match(birthDateRegex);
        if (birthDateMatch) {
            result.dateOfBirth = birthDateMatch[1];
        }

        // 4. Extract Gender (Nam/Nữ or Male/Female)
        const genderLine = texts.find(line => {
            const upper = line.toUpperCase();
            return upper.includes('GIỚI TÍNH') || upper.includes('GIOI TINH') || upper.includes('SEX');
        });
        if (genderLine) {
            if (/Nữ|Nu|Female/i.test(genderLine)) {
                result.gender = 'Nữ';
            } else if (/Nam|Male/i.test(genderLine)) {
                result.gender = 'Nam';
            }
        } else {
            // Fallback if no specific Gender keyword line is found
            if (/Nữ\b|Nu\b|Female\b/i.test(joinedText)) {
                result.gender = 'Nữ';
            } else if (/Nam\b|Male\b/i.test(joinedText)) {
                result.gender = 'Nam';
            }
        }

        // 5. Extract Nationality
        if (joinedText.includes('Việt Nam') || joinedText.includes('VIET NAM')) {
            result.nationality = 'Việt Nam';
        }

        // 6. Extract Full Name
        // Rule: Name usually appears after/below "Họ và tên" or "Họ tên" in bold uppercase
        for (let i = 0; i < texts.length; i++) {
            const line = texts[i].toUpperCase();
            if (line.includes('HỌ VÀ TÊN') || line.includes('HO VA TEN') || line.includes('HỌ TÊN') || line.includes('FULL NAME')) {
                // Check if current line contains the name inline (e.g., "Họ và tên: NGUYỄN VĂN A")
                const splitResult = texts[i].split(/[:\-\s]{2,}/);
                if (splitResult.length > 1 && splitResult[1].trim().length > 3) {
                    result.fullName = splitResult[1].trim();
                } else if (i + 1 < texts.length && this.isAllUpperCase(texts[i + 1])) {
                    // Name is usually fully capitalized on the next line
                    result.fullName = texts[i + 1].trim();
                }
                break;
            }
        }

        // If name still not found, search for a fully capitalized line of 2 to 5 words (avoid country/title)
        if (!result.fullName) {
            for (const text of texts) {
                const clean = text.trim();
                if (this.isAllUpperCase(clean) && clean.split(' ').length >= 2 && clean.split(' ').length <= 5) {
                    if (!clean.includes('CỘNG HÒA') && !clean.includes('ĐỘC LẬP') && !clean.includes('CĂN CƯỚC') && !clean.includes('VIỆT NAM')) {
                        result.fullName = clean;
                        break;
                    }
                }
            }
        }

        // 7. Extract Hometown & Residence
        // Hometown supports: Quê quán, Nơi ĐKKS, Nguyên quán.
        // Residence supports: Thường trú, Cư trú, Hộ khẩu thường trú.
        let hometownLines: string[] = [];
        let residenceLines: string[] = [];
        let capturingHometown = false;
        let capturingResidence = false;

        for (let i = 0; i < texts.length; i++) {
            const line = texts[i];
            const upperLine = line.toUpperCase();

            if (upperLine.includes('QUÊ QUÁN') || upperLine.includes('QUE QUAN') || upperLine.includes('NƠI ĐKKS') || upperLine.includes('NGUYÊN QUÁN') || upperLine.includes('NGUYEN QUAN')) {
                capturingHometown = true;
                capturingResidence = false;
                const part = line.split(/[:\-]\s*/);
                if (part.length > 1 && part[1].trim()) hometownLines.push(part[1].trim());
                continue;
            }

            if (upperLine.includes('THƯỜNG TRÚ') || upperLine.includes('THUONG TRU') || upperLine.includes('CƯ TRÚ') || upperLine.includes('CU TRU')) {
                capturingHometown = false;
                capturingResidence = true;
                const part = line.split(/[:\-]\s*/);
                if (part.length > 1 && part[1].trim()) residenceLines.push(part[1].trim());
                continue;
            }

            // Stop capture if next line keywords are encountered
            if (upperLine.includes('CÓ GIÁ TRỊ ĐẾN') || upperLine.includes('CỤC TRƯỞNG') || upperLine.includes('GIÁ TRỊ ĐẾN') || upperLine.includes('CO GIA TRI DEN')) {
                capturingHometown = false;
                capturingResidence = false;
            }

            if (capturingHometown) {
                hometownLines.push(line.trim());
            }
            if (capturingResidence) {
                residenceLines.push(line.trim());
            }
        }

        if (hometownLines.length > 0) result.hometown = hometownLines.join(', ').replace(/, ,/g, ',');
        if (residenceLines.length > 0) result.residence = residenceLines.join(', ').replace(/, ,/g, ',');

        // 8. Extract Expiry Date
        const expiryKeywords = ['CÓ GIÁ TRỊ ĐẾN', 'GIÁ TRỊ ĐẾN', 'CO GIA TRI DEN', 'EXP', 'EXPIRY'];
        for (let i = 0; i < texts.length; i++) {
            const upperLine = texts[i].toUpperCase();
            if (expiryKeywords.some(keyword => upperLine.includes(keyword))) {
                const match = texts[i].match(/(\d{2}\/\d{2}\/\d{4})/);
                if (match) {
                    result.expiryDate = match[1];
                    break;
                }
            }
        }

        return result;
    }

    public static isAllUpperCase(text: string): boolean {
        const clean = text.replace(/[^a-zA-ZĂâÂđĐêÊôÔơƠưƯáÁàÀảẢãÃạẠắẮằẰẳẲẵẴặẶấẤầẦẩẨẫẪậẬéÉèÈẻẺẽẼẹẸếẾềỀểỂễỄệỆíÍìÌỉỈĩĨịỊóÓòÒỏỎõÕọỌốỐồỒổỔỗỖộỘớỚờỜởỞỡỠợỢúÚùÙủỦũŨụỤứỨừỪửỬữỮựỰýÝỳỲỷỶỹỸỵỴ]/g, '');
        if (clean.length === 0) return false;
        return clean === clean.toUpperCase();
    }
}
