import { LogLine } from '@lsrv/api/logs';
import { PeggyParserAdapter } from './peggy.parser-adapter';

const adapter = new PeggyParserAdapter<LogLine>(false);

describe("Logs parser", () => {
    const COMMON_USER_EXPECTATION = {
        nickname: 'Nick',
        id: 0 
    };

    it("should parse ammo enter/leave string", async () => {
        const AMMO_ENTER = '1701907200 20241207T000000 <ammo/enter> Nick (0)';
        const AMMO_LEAVE = '1701907260 20241207T000100 <ammo/leave> Nick (0)';

        const parsedAmmoEnter = adapter.parse(Buffer.from(AMMO_ENTER));
        const parsedAmmoLeave = adapter.parse(Buffer.from(AMMO_LEAVE)); 

        expect(parsedAmmoEnter).toEqual({
            unix: 1701907200,
            date: '20241207T000000',
            process: 'ammo/enter',
            user: COMMON_USER_EXPECTATION
        });
        expect(parsedAmmoLeave).toEqual({
            unix: 1701907260,
            date: '20241207T000100',
            process: 'ammo/leave',
            user: COMMON_USER_EXPECTATION
        });
    });

    it("should parse armour interaction string", async () => {
        const ARMOUR_BUY = '1701907320 20241207T000200 <armour/buy> Nick (0)';
        const ARMOUR_PICKUP = '1701907380 20241207T000300 <armour/pickup> Nick (0)';

        const [parsedBuy, parsedPickup] = [ARMOUR_BUY, ARMOUR_PICKUP].map((string) => adapter.parse(Buffer.from(string)));

        expect(parsedBuy).toEqual({
            unix: 1701907320,
            date: '20241207T000200',
            process: 'armour/buy',
            user: COMMON_USER_EXPECTATION
        });
        expect(parsedPickup).toEqual({
            unix: 1701907380,
            date: '20241207T000300',
            process: 'armour/pickup',
            user: COMMON_USER_EXPECTATION
        });
    });

     it("should parse correct admin authentication", async () => {
        const CORRECT_ADM_AUTH = `1701907440 20241207T000400 <auth/correct/admin> Nick (0) id:1 'Логин' {Russia, cc:RU, ip:1.1.1.1, as:12389, ss:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA, org:ORG, cli:0.3.7-R5}`;
        const parsed = adapter.parse(Buffer.from(CORRECT_ADM_AUTH));

        expect(parsed).toEqual({
            unix: 1701907440,
            date: '20241207T000400',
            process: 'auth/correct/admin',
            user: COMMON_USER_EXPECTATION,
            subject: {
                user: { id: 1, name: 'Логин' }
            },
            serials: {
                cc: 'RU',
                ip: '1.1.1.1',
                as: 12389,
                ss: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                org: 'ORG',
                cli: '0.3.7-R5',
                country: 'Russia'
            }
        });
     });

     it("should parse correct guest authentication", async () => {
        const CORRECT_GUEST_AUTH = `1701907500 20241207T000500 <auth/correct/guest> Nick (0) {Russia, cc:RU, ip:1.1.1.1, as:12389, ss:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA, org:ORG, cli:0.3.7-R5}`;
        const parsed = adapter.parse(Buffer.from(CORRECT_GUEST_AUTH));

        expect(parsed).toEqual({
            unix: 1701907500,
            date: '20241207T000500',
            process: 'auth/correct/guest',
            user: COMMON_USER_EXPECTATION,
            serials: {
                cc: 'RU',
                ip: '1.1.1.1',
                as: 12389,
                ss: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                org: 'ORG',
                cli: '0.3.7-R5',
                country: 'Russia'
            }
        });
     });

     it("should parse correct user authentication", async () => {
        const CORRECT_USER_AUTH = `1701907560 20241207T000600 <auth/correct/user> Nick (0) id:1 'Login' {Russia, cc:RU, ip:1.1.1.1, as:12389, ss:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA, org:ORG, cli:0.3.7-R5}`;
        const parsed = adapter.parse(Buffer.from(CORRECT_USER_AUTH));

        expect(parsed).toEqual({
            unix: 1701907560,
            date: '20241207T000600',
            process: 'auth/correct/user',
            user: COMMON_USER_EXPECTATION,
            subject: {
                user: {
                    id: 1,
                    name: 'Login'
                }
            },
            serials: {
                cc: 'RU',
                ip: '1.1.1.1',
                as: 12389,
                ss: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                org: 'ORG',
                cli: '0.3.7-R5',
                country: 'Russia'
            }
        });
     });

    it("should parse auth error", async () => {
        const AUTH_ERR = `1701907620 20241207T000700 <auth/error> Nick (0) double account`;
        const parsed = adapter.parse(Buffer.from(AUTH_ERR));

        expect(parsed).toEqual({
            unix: 1701907620,
            date: '20241207T000700',
            process: 'auth/error',
            user: COMMON_USER_EXPECTATION,
            error: { reason: "double" }
        });
     });

     describe("bans", () => {         
         it("should parse CN ban", async () => {
            const line = '1701907800 20241207T001000 <ban/cn/hand> Nick (0) {cn:V3X6ZYPS0AMNRQWXQB1QIBODS0N4AG}';
            const parsed = adapter.parse(Buffer.from(line));
    
            expect(parsed).toMatchObject({
                serials: { cn: 'V3X6ZYPS0AMNRQWXQB1QIBODS0N4AG' }
            });
         });

         it("should parse add timer", async () => {
            const line = '1701907860 20241207T001100 <ban/timer/add> Nick (0) Name 123456';
            const parsed = adapter.parse(Buffer.from(line));
    
            expect(parsed).toMatchObject({
                user: COMMON_USER_EXPECTATION,
                subject: {
                    timer: {
                        nickname: 'Name',
                        schedule: 123456
                    }
                }
            });
         });

         it("should parse autoremove timer", async () => {
            const line = '1701908040 20241207T001400 <ban/timer/remove/auto> freemode_system Name 123456';
            const parsed = adapter.parse(Buffer.from(line));
    
            expect(parsed).toMatchObject({
                user: { nickname: 'freemode_system'},
                subject: {
                    timer: {
                        nickname: 'Name',
                        schedule: 123456
                    }
                }
            });
         });
     });

    describe("activities", () => {
       it("should parse baron action", async () => {
            const line = '1701908160 20241207T001600 <baron/create> Nick (0) baron_id: 1';
            const parsed = adapter.parse(Buffer.from(line));

            expect(parsed).toMatchObject({
                user: COMMON_USER_EXPECTATION,
                activity: { type: "baron", id: 1 }
            });
       }); 

       it("should parse basejump action", async () => {
            const line = '1701908460 20241207T002100 <base_jump/create> Nick (0) bjump_id: 1';
            const parsed = adapter.parse(Buffer.from(line));

            expect(parsed).toMatchObject({
                user: COMMON_USER_EXPECTATION,
                activity: { type: "bjump", id: 1 }
            });
       }); 
    });

    describe("chat", () => {
        it("should parse message", async () => {
            const line = `1701908760 20241207T002600 <chat/admin> Nick (0) 'сообщение с точкой. запятой, и другими знаками "kek"?! Prodam_garazh (0)'`;
            const parsed = adapter.parse(Buffer.from(line));

            expect(parsed).toMatchObject({
                user: COMMON_USER_EXPECTATION,
                message: 'сообщение с точкой. запятой, и другими знаками "kek"?! Prodam_garazh (0)'
            });
        });

        it("should parse block group", async () => {
            const line = `1701909240 20241207T003400 <chat/block/no_group> Nick (0) group`;
            const parsed = adapter.parse(Buffer.from(line));

            expect(parsed).toMatchObject({
                user: COMMON_USER_EXPECTATION,
                chat_block: 'group'
            });
        });

        it("should parse auto mute action", async () => {
            const line = `1701909780 20241207T004300 <chat/mute/auto> Nick (0) 10 мин 'нехороший человек'`;
            const parsed = adapter.parse(Buffer.from(line));

            expect(parsed).toMatchObject({
                user: COMMON_USER_EXPECTATION,
                chat_mute: {
                    duration: 10,
                    reason: 'нехороший человек'
                }
            });
        });
    });
});
