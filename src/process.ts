import events from 'events';
import readline from 'readline';
import validator from 'validator';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { Readable } from 'stream';

export interface Hop {
    hop: number;
    ip: string;
    rtt1: string;
    rtt2?: string;
    rtt3?: string;
}

export abstract class Process extends events.EventEmitter {
    process: ChildProcessWithoutNullStreams|null = null

    constructor(private command: string, private args: string[]) {
        super();
    }

    private readProcessStd(input: Readable) {
        let isDestinationCaptured = false
        readline.createInterface({
            input,
            terminal: false
        })
        .on('line', (line) => {
            if (!isDestinationCaptured) {
                const destination = this.parseDestination(line);
                if (destination !== null) {
                    this.emit('destination', destination);

                    isDestinationCaptured = true;
                }
            }

            const hop = this.parseHop(line);
            if (hop !== null) {
                this.emit('hop', hop);
            }
        });
    }

    public trace(domainName: string): void {
        if (!this.isValidDomainName(domainName)) {
            throw "Invalid domain name or IP address";
        }

        this.args.push(domainName);

        this.process = spawn(this.command, this.args);
        this.process.on('close', (code) => {
            this.emit('close', code);
        });

        this.emit('pid', this.process.pid);

        if (this.process.pid) {
            this.readProcessStd(this.process.stdout)
            this.readProcessStd(this.process.stderr)
        }
    }

    public kill(signal?: NodeJS.Signals | number) {
        if (this.process) {
            this.process.kill(signal)
            this.removeAllListeners()
        }
    }

    private isValidDomainName(domainName: string): boolean {
        return validator.isFQDN(domainName + '') || validator.isIP(domainName + '');
    }

    abstract parseDestination(data: string): string | null;
    abstract parseHop(hopData: string): Hop | null;
}
