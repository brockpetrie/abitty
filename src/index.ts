#!/usr/bin/env node

import * as fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface ContractConfig {
    name?: string;
    abiPath: string;
    pick: string[];
}

interface Config {
    outputDir: string;
    organize?: boolean;
    contracts: ContractConfig[];
}

const parseJsonFile = async (filePath: string, picks: string[]) => {
    try {
        const data = await fs.readJson(filePath);
        const abi = data.abi;

        const relevantAbis = abi.filter((item: any) => picks.includes(item.name));
        return relevantAbis;
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        throw error;
    }
};

const solidityTypeToTsType = (solidityType: string): string => {
    const arrayMatch = solidityType.match(/(.+)\[\]$/);
    if (arrayMatch) {
        return `${solidityTypeToTsType(arrayMatch[1])}[]`;
    }

    switch (solidityType) {
        case 'uint256':
        case 'uint':
        case 'int256':
        case 'int':
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'int8':
        case 'int16':
        case 'int32':
            return 'number';
        case 'address':
            return '`0x${string}`';
        case 'bool':
            return 'boolean';
        case 'bytes':
        case 'string':
            return 'string';
        default:
            return 'unknown';
    }
};

const generateTupleType = (components: any[], tupleName: string): string => {
    const fields = components
        .map((component) => {
            const type = component.type.startsWith('tuple')
                ? generateTupleType(component.components, capitalizeFirstLetter(component.name))
                : solidityTypeToTsType(component.type);

            return `${component.name}: ${type};`;
        })
        .join('\n  ');

    return `export type ${tupleName} = {\n  ${fields}\n};`;
};

const generateTypeDefinitions = (abi: any, contractName: string) => {
    if (abi.type !== 'function') {
        return '';
    }

    let typeDefinitions = '';
    const inputs = abi.inputs
        .map((input: any) => {
            if (input.type.startsWith('tuple')) {
                const tupleName = capitalizeFirstLetter(input.name);
                typeDefinitions += generateTupleType(input.components, tupleName);
                return `${tupleName}${input.type.endsWith('[]') ? '[]' : ''}`;
            }

            return solidityTypeToTsType(input.type);
        })
        .join(', ');

    typeDefinitions += `\nexport type ${capitalizeFirstLetter(abi.name)}Args = [${inputs}];`;
    return typeDefinitions;
};

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const saveAbisToFiles = async (abis: any[], outputDir: string, contractName?: string, organize: boolean = false) => {
    try {
        const dir = organize && contractName ? path.join(outputDir, contractName) : outputDir;
        await fs.ensureDir(dir);

        const indexContent: string[] = [];

        for (const abi of abis) {
            const filePath = path.join(dir, `${abi.name}.ts`);
            const fileContent = `export const ${abi.name}Abi = ${JSON.stringify(abi, null, 2)} as const;\n`;
            const typeDefinitions = generateTypeDefinitions(abi, contractName || '');
            const fullContent = fileContent + (typeDefinitions ? `\n${typeDefinitions}\n` : '');

            await fs.writeFile(filePath, fullContent, 'utf8');
            indexContent.push(`export * from './${abi.name}';`);
        }

        if (organize && contractName) {
            const indexFilePath = path.join(dir, `index.ts`);
            await fs.writeFile(indexFilePath, indexContent.join('\n'), 'utf8');
        }
    } catch (error) {
        console.error('Error saving ABIs to files:', error);
        throw error;
    }
};

const run = async () => {
    const argv = yargs(hideBin(process.argv)).argv as { config?: string };
    const configPath = argv.config || './abitty.config.json';

    try {
        const config: Config = await fs.readJson(configPath);

        for (const contract of config.contracts) {
            const relevantAbis = await parseJsonFile(contract.abiPath, contract.pick);
            await saveAbisToFiles(relevantAbis, config.outputDir, contract.name, config.organize);
        }

        console.log('ABIs saved successfully.');
    } catch (error) {
        console.error('Error in main execution:', error);
    }
};

if (require.main === module) {
    run();
}

export { run };
