# error-handling-options

This demonstrates different options for handling errors with more verbose error stack traces. 

## End goal

Pip sees an alert in Sentry with an easy to understand error message. Pip would like to understand more about the error including
- which endpoint triggered it
- any arguments used
- which step of the process the error occurred on
To look for this additional information Pip opens Sentry and can see this data in the error stack trace. 

## How to run the demo

### Pre-requsites
- Node and npm installed
- pnpm installed globally

### Install dependencies

```bash
pnpm install
```

### Run the project

```bash
cd packages/nest
pnpm run start
```

### Trigger different scenarios

#### Original use case/existing behaviour:
```bash
curl --request GET \
  --url http://localhost:3000/show
```

#### Custom wrapping of errors in an array, inspired by GO approach
```bash
curl --request GET \
  --url http://localhost:3000/wrapShow
```

#### vError
```bash
curl --request GET \
  --url http://localhost:3000/vErrorShow
```

#### tsError
```bash
curl --request GET \
  --url http://localhost:3000/tsErrorShow
```
