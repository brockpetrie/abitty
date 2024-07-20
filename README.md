# Abitty 👌

Abitty cherry-picks specific functions from your Solidity ABIs and saves them for individual importing. Stop using thicc JSON files, start shaking that tree.

## Configuration

Create `abitty.config.json` in your project directory.

```json
{
    "outputDir": "./src/types",
    "organize": true,
    "contracts": [
        {
            "name": "foo",
            "abiPath": "../out/Foo.sol/Foo.json",
            "pick": ["someFunction", "someOtherFunction", "amazingFunction"]
        },
        {
            "name": "bar",
            "abiPath": "../out/Bar.sol/Bar.json",
            "pick": ["excellentFunction"]
        }
    ]
}
```

#### Config spec

| key                |                                                                                | required  |
| ------------------ | ------------------------------------------------------------------------------ | --------- |
| `outputDir`        | Relative path where the generated files will go                                | **Yes**   |
| `organize`         | If `true`, organizes contract files in folders and creates a single entrypoint | No        |
| `contracts`        | An array of `Contract`s 👇                                                     | **Yes**   |
|                    |
| `Contract.name`    | Used for generating folder names, required if `organize` is set to true        | Sometimes |
| `Contract.abiPath` | Path to your Solidity build artifact's JSON file                               | **Yes**   |
| `Contract.pick`    | Functions you want to use                                                      | **Yes**   |

## Generating your files

Install as a dev dependency and add to your package scripts

```sh
npm install abitty --save-dev
```

```json
"scripts": {
    "gimme-them-abis": "abitty"
},
```

or skip this above and run with npx

```sh
npx abitty
```

The script will output an individual .ts file for each function, plus a helper type you can use to ensure arguments passed to that function satisfy the ABI.

If you are using a different configuration file, pass it to Abitty with the `--config-file` flag.

## Using your exports

They work great with Viem / Wagmi which you should definitely be using.

```ts
import { doTheFooAbi, DoTheFooArgs } from 'yourOutputDir/foo/doTheFoo';

await publicClient.simulateContract({
    abi: [doTheFooAbi],
    address: fooAddress,
    functionName: 'doTheFoo',
    args: [myArg1, myArg2, myArg3],
    account: userAccount,
});

// You can use the generated argument typings like so:
const myArgs = [myArg1, myArg2, myArg3] satisfies DoTheFooArgs;
```

---

MIT license, do whatever you want with it. Contributions welcome.

Like it? Love it? Donate a few dollars to your local humane society for the fluffies 🐶🐱
