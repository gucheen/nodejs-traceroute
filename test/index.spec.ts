import validator from 'validator';

import Traceroute from '../src/index';

describe('Traceroute', () => {
    it('should verify pid, destination, hops and close code', (wait) => {
        const tracer = new Traceroute();

        tracer
            .on('pid', (pid) => {
                expect(Number.isInteger(pid)).toBeTruthy();
            })
            .on('destination', (destination) => {
                expect(validator.isIP(destination)).toBeTruthy();
            })
            .on('hop', (hopObj) => {
                const { hop, ip, rtt1 } = hopObj;

                expect(Number.isInteger(hop)).toBeTruthy();
                expect(validator.isIP(ip) || ip === '*').toBeTruthy();
                expect(/^\d+\.\d+\sms$/.test(rtt1) || rtt1 === '*').toBeTruthy();
            })
            .on('close', (code) => {
                expect(Number.isInteger(code)).toBeTruthy();

                wait();
            });

        tracer.trace('github.com');
    }, 60000);

    it('should exit trace by calling kill method', (done) => {
        const tracer = new Traceroute();

        tracer.trace('github.com');

        setTimeout(() => {
            tracer.kill()
            expect(tracer.process?.killed).toBeTruthy()
            done()
        }, 5000)
    }, 10000);
});
