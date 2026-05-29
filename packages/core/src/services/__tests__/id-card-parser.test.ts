import { describe, it, expect } from 'vitest';
import { VietnameseParser } from '../parsers/vietnamese-parser';

describe('Vietnamese ID Card Parser (NLP Heuristics & Regex Tests)', () => {
    it('nên nhận diện đúng CCCD Gắn Chip Việt Nam', () => {
        const simulatedTexts = [
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
            "Độc lập - Tự do - Hạnh phúc",
            "CĂN CƯỚC CÔNG DÂN",
            "Số / No.: 037096014589",
            "Họ và tên / Full name",
            "NGUYỄN THỊ THU DIỆU",
            "Ngày sinh / Date of birth: 24/08/1996",
            "Giới tính / Sex: Nữ  Quốc tịch / Nationality: Việt Nam",
            "Quê quán / Place of origin:",
            "Ý Yên, Nam Định",
            "Nơi thường trú / Place of residence:",
            "Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội",
            "Có giá trị đến / Date of expiry: 24/08/2036"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(simulatedTexts);

        expect(result.documentType).toBe('CCCD_CHIP');
        expect(result.idNumber).toBe('037096014589');
        expect(result.fullName).toBe('NGUYỄN THỊ THU DIỆU');
        expect(result.dateOfBirth).toBe('24/08/1996');
        expect(result.gender).toBe('Nữ');
        expect(result.nationality).toBe('Việt Nam');
        expect(result.hometown).toContain('Ý Yên, Nam Định');
        expect(result.residence).toContain('Phường Mễ Trì');
        expect(result.expiryDate).toBe('24/08/2036');
    });

    it('nên nhận diện đúng CCCD Mã Vạch (loại cũ)', () => {
        const simulatedTexts = [
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
            "ĐỘC LẬP - TỰ DO - HẠNH PHÚC",
            "CĂN CƯỚC CÔNG DÂN",
            "Số: 001095000123",
            "Họ và tên: TRẦN VĂN AN",
            "Ngày sinh: 15/12/1995",
            "Giới tính: Nam",
            "Quốc tịch: Việt Nam",
            "Quê quán: Hải Hậu, Nam Định",
            "Nơi thường trú: Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(simulatedTexts);

        expect(result.documentType).toBe('CCCD_CODE');
        expect(result.idNumber).toBe('001095000123');
        expect(result.fullName).toBe('TRẦN VĂN AN');
        expect(result.dateOfBirth).toBe('15/12/1995');
        expect(result.gender).toBe('Nam');
        expect(result.hometown).toContain('Hải Hậu');
        expect(result.residence).toContain('Hàng Bài');
    });

    it('nên nhận diện đúng Giấy Phép Lái Xe (GPLX)', () => {
        const simulatedTexts = [
            "SỞ GIAO THÔNG VẬN TẢI HÀ NỘI",
            "GIẤY PHÉP LÁI XE / DRIVING LICENCE",
            "Số / No. 290145893012",
            "Họ tên / Name: PHẠM MINH ĐỨC",
            "Ngày sinh / Date of birth: 01/01/1990",
            "Quốc tịch / Nationality: Việt Nam",
            "Nơi cư trú / Place of residence: Cầu Giấy, Hà Nội"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(simulatedTexts);

        expect(result.documentType).toBe('GPLX');
        expect(result.idNumber).toBe('290145893012');
        expect(result.fullName).toBe('PHẠM MINH ĐỨC');
        expect(result.dateOfBirth).toBe('01/01/1990');
        expect(result.residence).toContain('Cầu Giấy');
    });

    it('nên nhận diện đúng Chứng Minh Nhân Dân 9 số', () => {
        const simulatedTexts = [
            "GIẤY CHỨNG MINH NHÂN DÂN",
            "Số: 142589634",
            "Họ tên: LÊ HOÀNG NAM",
            "Ngày sinh: 20/05/1988",
            "Nguyên quán: Thanh Hóa",
            "Nơi ĐK hộ khẩu thường trú: Phường Bến Nghé, Quận 1, TP Hồ Chí Minh"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(simulatedTexts);

        expect(result.documentType).toBe('CMND_9_12');
        expect(result.idNumber).toBe('142589634');
        expect(result.fullName).toBe('LÊ HOÀNG NAM');
        expect(result.dateOfBirth).toBe('20/05/1988');
        expect(result.residence).toContain('Bến Nghé');
    });
});
