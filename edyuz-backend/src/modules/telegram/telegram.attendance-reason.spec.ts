import { TelegramService } from './telegram.service';

describe('TelegramService.sendAttendanceAlert — sabab', () => {
  const make = () => {
    const svc: any = new (TelegramService as any)({ get: () => undefined }, {}, {});
    svc.sendMessage = jest.fn().mockResolvedValue(true);
    return svc;
  };

  it("izoh bo'lsa xabarga qo'shiladi (HTML-xavfsiz), eslatma qatori chiqmaydi", async () => {
    const svc = make();
    await svc.sendAttendanceAlert(BigInt(1), 'Ali', 'IT', 'absent', '2026-11-24', 'Kasal <b>');
    const text = svc.sendMessage.mock.calls[0][1];
    expect(text).toContain("O'qituvchi izohi:");
    expect(text).toContain('Kasal &lt;b&gt;');
    expect(text).not.toContain('sababini ma’muriyatga');
  });

  it("izoh bo'lmasa avvalgi eslatma qoladi", async () => {
    const svc = make();
    await svc.sendAttendanceAlert(BigInt(1), 'Ali', 'IT', 'absent', '2026-11-24');
    expect(svc.sendMessage.mock.calls[0][1]).toContain('sababini ma’muriyatga');
  });
});
