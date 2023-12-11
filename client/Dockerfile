FROM node:latest as build
WORKDIR /usr/local/app/

RUN npm cache clean --force
COPY . .
RUN npm install -g @angular/cli
RUN npm install --save-dev @angular-devkit/build-angular
RUN npm install & npm run build

FROM nginx:latest
COPY --from=build /usr/local/app/dist/client/ /usr/share/nginx/html

EXPOSE 80