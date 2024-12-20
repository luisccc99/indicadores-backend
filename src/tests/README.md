# Notas para pruebas

## Pruebas unitarias
Las pruebas unitarias son ...
- Te ayuda para hacer TDD (Test Driven Development)
- No dependas de llamadas a bases de datos, lectura de archivos o cualquiera dependencia externa

## Pruebas de integración
Las pruebas de integración son ...
- Verificar que el feature se comporte de la manera adecuada

## Cuándo usar cada una de ellas
Es deseable utilizar ambas, las pruebas unitarias para empezar el desarrollo de un feature y 
las de integración para verificar que el endpoint se comporte realmente como esperas

## Dos
- Utiliza docker para crear una base de datos de prueba local,
TODO: Agregar comando para ejecutar base de datos con docker (create volume, docker run -dp...)
TODO: Agregar comandos para ejecutar migraciones (sequelize-cli)

## Don'ts
- No subas agrupaciones de pruebas con llamadas a **.only**
