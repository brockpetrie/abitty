import { run } from './index';
import * as fs from 'fs-extra';
import * as path from 'path';

const mockConfigPath = path.join(__dirname, '..', 'abitty.config.json');
const mockAbiPath = path.join(__dirname, 'Example.json');
const mockOutputDir = path.join(__dirname, 'types');

const mockConfig = {
    outputDir: mockOutputDir,
    organize: true,
    contracts: [
        {
            name: 'testContract',
            abiPath: mockAbiPath,
            pick: ['mintBatch'],
        },
    ],
};

const mockAbi = {
    abi: [
        {
            type: 'function',
            name: 'mintBatch',
            inputs: [
                {
                    name: 'to',
                    type: 'address',
                    internalType: 'address',
                },
                {
                    name: 'quantity',
                    type: 'uint256',
                    internalType: 'uint256',
                },
            ],
            outputs: [
                {
                    name: 'tokenIds',
                    type: 'uint256[]',
                    internalType: 'uint256[]',
                },
            ],
            stateMutability: 'payable',
        },
    ],
};

beforeAll(async () => {
    await fs.writeJson(mockConfigPath, mockConfig);
    await fs.writeJson(mockAbiPath, mockAbi);
});

afterAll(async () => {
    await fs.remove(mockConfigPath);
    await fs.remove(mockAbiPath);
    await fs.remove(mockOutputDir);
});

test('run function should generate correct ABI and types', async () => {
    await run();

    const generatedAbiPath = path.join(mockOutputDir, 'testContract', 'mintBatch.ts');
    const generatedAbi = await fs.readFile(generatedAbiPath, 'utf-8');

    expect(generatedAbi).toContain('export const mintBatchAbi');
    expect(generatedAbi).toContain('export type MintBatchArgs = [`0x${string}`, number];');
});
