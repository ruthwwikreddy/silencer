// app/api/readings/route.ts
import { NextResponse } from 'next/server';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// Adjust this to match your Arduino's serial port (e.g., /dev/tty.usbmodem14101)
const SERIAL_PORT_PATH = process.env.SERIAL_PORT_PATH || '/dev/tty.usbmodem14101';
const BAUD_RATE = 9600;

let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;

function getSerialPort() {
    if (!port) {
        port = new SerialPort({ path: SERIAL_PORT_PATH, baudRate: BAUD_RATE });
        parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
        console.log('🔌 Serial port opened:', SERIAL_PORT_PATH);
    }
    return parser!;
}

export async function GET(request: Request) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Send SSE headers
    const response = new NextResponse(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });

    const parser = getSerialPort();

    const onData = (data: string) => {
        // Expecting JSON like {"before":123,"after":45,"reduction":12.3}
        try {
            const json = JSON.parse(data.trim());
            const payload = `data: ${JSON.stringify(json)}\n\n`;
            writer.write(new TextEncoder().encode(payload));
        } catch (e) {
            // ignore malformed lines
        }
    };

    parser.on('data', onData);

    // Cleanup when client disconnects
    request.signal.addEventListener('abort', () => {
        parser.off('data', onData);
        writer.close();
        console.log('🛑 SSE client disconnected');
    });

    return response;
}
