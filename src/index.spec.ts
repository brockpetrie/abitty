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
            pick: ['mintBatch', 'forge', 'editAttributes'],
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
        {
            type: 'function',
            name: 'forge',
            inputs: [
                {
                    name: 'attributeAddresses',
                    type: 'address[]',
                    internalType: 'address[]',
                },
                {
                    name: 'tokenIds',
                    type: 'uint256[]',
                    internalType: 'uint256[]',
                },
            ],
            outputs: [
                {
                    name: '',
                    type: 'uint256',
                    internalType: 'uint256',
                },
            ],
            stateMutability: 'nonpayable',
        },
        {
            type: 'function',
            name: 'editAttributes',
            inputs: [
                {
                    name: 'edits',
                    type: 'tuple[]',
                    internalType: 'struct IElephant.AttributeEdit[]',
                    components: [
                        {
                            name: 'action',
                            type: 'uint8',
                            internalType: 'enum IElephant.ActionType',
                        },
                        {
                            name: 'oldAddress',
                            type: 'address',
                            internalType: 'address',
                        },
                        {
                            name: 'oldTokenId',
                            type: 'uint256',
                            internalType: 'uint256',
                        },
                        {
                            name: 'newAddress',
                            type: 'address',
                            internalType: 'address',
                        },
                        {
                            name: 'newTokenId',
                            type: 'uint256',
                            internalType: 'uint256',
                        },
                    ],
                },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
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

    const generatedMintBatchAbiPath = path.join(mockOutputDir, 'testContract', 'mintBatch.ts');
    const generatedMintBatchAbi = await fs.readFile(generatedMintBatchAbiPath, 'utf-8');

    expect(generatedMintBatchAbi).toContain('export const mintBatchAbi');
    expect(generatedMintBatchAbi).toContain('export type MintBatchArgs = [`0x${string}`, number];');

    console.log('✅ Simple types handled successfully');

    const generatedForgeAbiPath = path.join(mockOutputDir, 'testContract', 'forge.ts');
    const generatedForgeAbi = await fs.readFile(generatedForgeAbiPath, 'utf-8');

    expect(generatedForgeAbi).toContain('export const forgeAbi');
    expect(generatedForgeAbi).toContain('export type ForgeArgs = [`0x${string}`[], number[]];');

    console.log('✅ Arrays types handled successfully');

    const generatedEditAttributesAbiPath = path.join(mockOutputDir, 'testContract', 'editAttributes.ts');
    const generatedEditAttributesAbi = await fs.readFile(generatedEditAttributesAbiPath, 'utf-8');

    expect(generatedEditAttributesAbi).toContain('export const editAttributesAbi');
    expect(generatedEditAttributesAbi).toMatch(/export type EditAttributesArgs = \[Edits\[\]\];/);
    expect(generatedEditAttributesAbi).toMatch(
        /export type Edits = \{\s*action: number;\s*oldAddress: `0x\$\{string\}`;\s*oldTokenId: number;\s*newAddress: `0x\$\{string\}`;\s*newTokenId: number;\s*\};/,
    );

    console.log('✅ Tuple types handled successfully');
});
