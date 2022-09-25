# Requisitos

## Básicos

* Node LTS (v16) o superior.
* Gestor de dependencias compatible con NPM incluído en Node.

## Depuración

* Navegador/es instalado/s en el dispositivo objetivo.
* En el caso de navegadores Android: Android Debug Bridge (adb).

# Preparación

1. Instalar dependencias: `npm install`.
1. Copiar `assets/data/env.template.json` en `assets/data/env.json` escribiendo el correspondiente `twitchClientId`.
1. (*Opcional*) Si hay canales en youtube (verificar que `assets/data/data.json` en la clave `channels` incluya algun valor que comience por "youtube:") copiar `assets/data/youtube.env.template.json` en `assets/data/youtube.env.json` escribiendo el correspondiente `youtubeClientId`.
1. (*Opcional*) Si no sólo se pretende usar los paquetes genéricos, copiar `webpack/data/env.template.json` en `webpack/data/env.json` configurándolo si es necesario:
    * `browserPaths`: Ruta al ejecutable del navegador o nombre en caso de Firefox (también admite ruta) con variables.
    * `store`: Claves públicas de las tiendas. Se utiliza tanto para publicar la extensión como para asegurar una ID estable.
    * `browser`: Otra información relacionada con el navegador. Incluye en `chrome` -> `googleOauthClientId` en ID de cliente de Oauth para navegadores Chrome y opciones relacionadas con Android Debug Bridge (adb) en `firefox-android` para navegadores Firefox (Android).

# Generación de paquetes independientes

Se pueden generar los paquetes individuales mediante `npm run build:<nombre>` segun se ha establecido en el [README](README.md#paquete-independiente). 
También se incluyen scripts que generan múltiples:
* `npm run build`: chrome, edge, firefox y opera.
* `npm run build:generic`: generic.v2 y generic.v3.

# Depuración



Se pueden depurar los paquetes mediante `npm run watch:<nombre>` donde el *Nombre* aparece en la siguiente tabla:

| Nombre         | Versión         | Tienda               | Extra                                                                                                                |
|-----------------|-----------------|----------------------|----------------------------------------------------------------------------------------------------------------------|
| chrome          | chrome          | chromeStore          | googleOauthClientId si se usa Youtube                                                                                |
| edge            | edge            | edgeAddons           | -                                                                                                                    |
| firefox         | firefox         | mozillaAddons        | -                                                                                                                    |
| opera           | opera           | operaDeveloper       | -                                                                                                                    |
| firefox.v3      | firefox         | mozillaAddons        | -                                                                                                                    |
| firefox-android | firefox-android | mozillaAddonsAndroid | **adbDevice**, adbBin, adbHost, adbPort, adbDiscoveryTimeout, adbRemoveOldArtifacts, firefoxApk, firefoxApkComponent |

## Leyenda

* *Nombre*: Identificador del paquete.
* *Versión*: Clave de `webpack/data/versions.json`.
* *Tienda*: Clave de `webpack/data/env.json` en `store`.
* *Extra*: Clave de `webpack/data/env.json` en `browser` -> `[nombre]`.

# Comprobación estática de código de Typescript

En la construción o depuración de paquetes se realiza automáticamente aunque se puede ejecutar directamente mediante `npm run lint`. Dichos procesos requieren que no hay ninguna advertencia o error para proceder correctamente.
