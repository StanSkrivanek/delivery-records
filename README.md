# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

<!-- --------------------------------------------------------------------
KRIS
INVOICE 7,063.00
PAID 6,350.00
---------------
DUE 713.00
-------------------------------------------------------------------- -->

<!-- TODO -->

ADDITIONAL FEATURES

- [ ] Setting page
  - [ ] Depot setting
    - [ ] Add depot (address, name, description)
    - [ ] Edit depot (address, name, description)
    - [ ] Delete depot (address, name, description)
    - [ ] Set default depot
  - [ ] Vehicle setting
    - [ ] Add vehicle (name, description, license plate, capacity)
    - [ ] Edit vehicle (name, description, license plate, capacity)
    - [ ] Delete vehicle (name, description, license plate, capacity)
    - [ ] Assign vehicle to depot
    - [ ] Set default vehicle for depot
  - [ ] Driver setting
    - [ ] Add driver (name, description, phone number)
    - [ ] Edit driver (name, description, phone number)
    - [ ] Delete driver (name, description, phone number)
    - [ ] Set default driver for vehicle
  - [ ] Parcels setting
    - [ ] Collection default price per item
    - [ ] Delivery default price per item
    - [ ] add other parcel price with option Delivery or Pickup (special deals from GLS) will add input into daily report form
  - [ ]
