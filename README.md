# therapydash-demo
Demo therapy scheduling program. Completes all requirements specified except for testing and search functionality due to time constraints.

The backend application uses express and is architected with a model and controller pattern. The Sequelize ORM was used to define models and interact with the database, both in order to lessen the security burden of a simple demo project, and to save time. Constraints like access control are managed in the controllers, and data integrity is enforced in the models and the schema where possible. Database location can be configured in .env or left default (as the cloud-deployed version cannot use it in place). Login is enforced in the required controller operations by a small authentication middleware function. As this is a demo, the JWT secret is stored in the .env file and commited to the project. Obviously for a real application, this would constitute a data breach. Passwords are stored using bcrypt on the backend for secure storage.

The frontend is an Angular application written in Typescript. I chose Angular in order to refresh myself on it and found it quite easy to get back into. The frontend consists of three components and two services. I implemented each page, including the dashboard as a single component for simplicity's sake. The auth service and auth guard manage authentication state and ensure that the user is redirected to login when neccessary. The session service manages communication with the backend regarding sessions.

For cloud deployment I chose Akamai, as I already use it for some personal things (but deploying to other cloud services would be trivial). [Here](https://therapydash.7447a.ca/) is a live demo.

To run locally, use the provided `start-dev` scripts. There is a Windows `.bat` file and a *nix `.sh` script. The frontend starts locally on port 4200, and the backend on port 3000. Make sure Node and NPM are installed and in your path.
