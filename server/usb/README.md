# Klaviaturasiz avtomatik o'rnatish (fleshka)

Klaviatura/sichqoncha ishlamasa ham Ubuntu Server 24.04 o'zi o'rnatiladi, Docker va EduYuz kodi tayyor turadi.

> ⚠️ Kompyuterning **ichki diskidagi hamma narsa o'chiriladi**. Fleshka va USB disklarga tegilmaydi.

## Fleshkani tayyorlash (Windows'da)
1. Rufus bilan Ubuntu Server 24.04 yozilgan fleshkani Windows kompyuterga qayta ulang (u "Ubuntu-Server 24.04" nomli disk bo'lib ko'rinadi).
2. `autoinstall.yaml` faylini fleshkaning **eng yuqori papkasiga** nusxalang (`boot`, `casper` papkalari yoniga).
3. Fleshkadagi `boot\grub\grub.cfg` faylini shu papkadagi `grub.cfg` bilan **almashtiring**.
4. Fleshkani xavfsiz chiqaring.

## O'rnatish
1. Eski kompyuterga **internet kabelini** (router → kompyuter) va fleshkani ulang.
2. Kompyuterni yoqing. Fleshkadan yuklanishi kerak: BIOS'da boot tartibida USB birinchi bo'lsin
   (bir marta klaviatura kerak bo'lishi mumkin — orqa portdagi simli klaviatura bilan).
3. 5 soniyadan keyin o'rnatish **o'zi** boshlanadi. 15–30 daqiqa kuting — kompyuter o'zi qayta yonadi.
4. Qayta yongach fleshkani chiqarib oling.

## Serverga ulanish (boshqa kompyuter yoki telefondan)
Windows'da **PowerShell** oching:
```
ssh eduyuz@eduyuz.local
```
`eduyuz.local` topilmasa, routerning admin sahifasida (odatda 192.168.1.1) "eduyuz" qurilmasining IP manzilini ko'rib, `ssh eduyuz@192.168.1.X` yozing.
Parol alohida berilgan. Birinchi kirishda almashtiring: `passwd`.

Keyin: `cd ~/EduYuz/server && bash setup.sh` — qolgani `server/README.md`da.
