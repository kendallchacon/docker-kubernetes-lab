# Docker & Kubernetes Lab

Laboratorio práctico desarrollado para el proyecto **«Contenedores y orquestación: Docker y Kubernetes en la práctica»**.

La aplicación simula una pequeña tienda compuesta por dos servicios:

- **Frontend** — interfaz web y proxy de pedidos.
- **Orders Service** — API encargada de procesar los pedidos.

El objetivo es utilizar la misma aplicación para demostrar primero su ejecución con **Docker** y luego su despliegue, escalado y recuperación con **Kubernetes**.

## Arquitectura

```text
Navegador
    ↓
Frontend :8080
    ↓
Orders Service :3001
```

Cada pedido devuelve `processedBy`, permitiendo identificar qué contenedor o Pod procesó la solicitud.

## Estructura

```text
frontend/                  Frontend Express
orders-service/            API de pedidos
kubernetes/                Deployments y Services
.github/workflows/         Publicación de imágenes en GHCR
docs/workshop-commands.md  Referencia de comandos
compose.yml                Configuración Docker Compose
```

## Docker

El laboratorio utiliza **Killercoda** y no requiere instalar Docker localmente.

Después de clonar el repositorio:

```sh
git clone https://github.com/kendallchacon/docker-kubernetes-lab.git
cd docker-kubernetes-lab
```

Levanta ambos servicios con:

```sh
docker compose up --build -d
```

Comprueba su estado:

```sh
docker compose ps
```

El frontend queda disponible en el puerto `8080`.

Para detener el laboratorio:

```sh
docker compose down
```

## Kubernetes

Los manifiestos están disponibles en:

```text
kubernetes/
├── frontend-deployment.yaml
├── frontend-service.yaml
├── orders-deployment.yaml
└── orders-service.yaml
```

Las imágenes utilizadas por Kubernetes se publican en **GHCR — GitHub Container Registry**:

```text
ghcr.io/kendallchacon/docker-kubernetes-lab-frontend:latest
ghcr.io/kendallchacon/docker-kubernetes-lab-orders-service:latest
```

El laboratorio permite demostrar:

- Deployments y Services;
- comunicación entre Pods;
- escalado horizontal;
- múltiples réplicas de `orders-service`;
- logs de pedidos por Pod;
- self-healing al eliminar una réplica.

## Taller completo

El procedimiento completo, explicado paso a paso y con comandos listos para copiar, está disponible en la presentación interactiva del proyecto:

**Docker + Kubernetes en la práctica**

> https://docker-kubernetes-presentation.vercel.app

El taller incluye dos recorridos:

```text
Docker
→ construir
→ ejecutar
→ probar la aplicación

Kubernetes
→ desplegar
→ escalar
→ observar logs
→ eliminar un Pod
→ comprobar self-healing
```

También existe una referencia de comandos en:

[`docs/workshop-commands.md`](docs/workshop-commands.md)

## Publicación de imágenes

El workflow:

```text
.github/workflows/publish-images.yml
```

publica automáticamente las imágenes de `frontend` y `orders-service` en GHCR cuando se realizan cambios en `main`.

Esta preparación no forma parte de los pasos que debe realizar el estudiante durante el taller.

## Tecnologías

- Docker
- Docker Compose
- Kubernetes
- Node.js / Express
- GitHub Actions
- GitHub Container Registry
- Killercoda
