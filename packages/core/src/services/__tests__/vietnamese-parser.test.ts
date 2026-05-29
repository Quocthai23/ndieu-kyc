import { describe, it, expect } from 'vitest';
import { VietnameseParser } from '../parsers/vietnamese-parser';

describe('VietnameseParser', () => {
    it('should extract correct information from simulated CCCD text', () => {
        const simulatedOcrTexts = [
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
            "Phường Mễ Trì, Quận Nam Từ Liêm",
            "Thành phố Hà Nội",
            "Có giá trị đến / Date of expiry: 24/08/2036"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(simulatedOcrTexts);

        expect(result.documentType).toBe('CCCD_CHIP');
        expect(result.idNumber).toBe('037096014589');
        expect(result.fullName).toBe('NGUYỄN THỊ THU DIỆU');
        expect(result.dateOfBirth).toBe('24/08/1996');
        expect(result.gender).toBe('Nữ');
        expect(result.nationality).toBe('Việt Nam');
        expect(result.hometown).toBe('Ý Yên, Nam Định');
        expect(result.residence).toBe('Phường Mễ Trì, Quận Nam Từ Liêm, Thành phố Hà Nội');
        expect(result.expiryDate).toBe('24/08/2036');
    });

    it('should handle CMND 9 digits correctly', () => {
        const cmndTexts = [
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
            "Độc lập - Tự do - Hạnh phúc",
            "CHỨNG MINH NHÂN DÂN",
            "Số 163254987",
            "Họ và tên: TRẦN VĂN BÌNH",
            "Sinh ngày: 01/01/1990",
            "Nguyên quán: Vụ Bản, Nam Định",
            "Nơi ĐKHK thường trú: Nam Định"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(cmndTexts);

        expect(result.documentType).toBe('CMND_9_12');
        expect(result.idNumber).toBe('163254987');
        expect(result.fullName).toBe('TRẦN VĂN BÌNH');
        expect(result.dateOfBirth).toBe('01/01/1990');
    });

    it('should handle GPLX correctly', () => {
        const gplxTexts = [
            "GIẤY PHÉP LÁI XE",
            "Số: 010123456789",
            "Họ và tên: LÊ THỊ HOA",
            "Ngày sinh: 15/05/1985",
            "Quốc tịch: VIỆT NAM",
            "Nơi cư trú: Cầu Giấy, Hà Nội",
            "Có giá trị đến: 15/05/2035"
        ];

        const result = VietnameseParser.parseVietnameseIdCard(gplxTexts);

        expect(result.documentType).toBe('GPLX');
        expect(result.idNumber).toBe('010123456789');
        expect(result.fullName).toBe('LÊ THỊ HOA');
        expect(result.dateOfBirth).toBe('15/05/1985');
        expect(result.residence).toBe('Cầu Giấy, Hà Nội');
        expect(result.expiryDate).toBe('15/05/2035');
    });
});
