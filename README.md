# Laboratorio: Docker y Kubernetes en la práctica

Este repositorio acompaña la investigación **«Contenedores y orquestación: Docker y Kubernetes en la práctica»**. La aplicación es una tienda pequeña con tres productos. Su propósito es hacer visibles las imágenes, redes, servicios, réplicas y recuperación de Pods.

**No se requiere instalar Docker ni Kubernetes localmente para realizar el taller.** Los estudiantes ejecutan Docker en [Play with Docker](https://labs.play-with-docker.com/) y Kubernetes en [Killercoda](https://killercoda.com/). Las comprobaciones locales son opcionales para quienes mantienen el laboratorio.

## Arquitectura

```text
Navegador ──HTTP──> Frontend (:8080) ──POST /orders──> Orders Service (:3001)
                    GET /health                   GET /health
                    POST /api/orders              POST /orders
```

El navegador habla únicamente con el frontend. Su servidor Express sirve HTML, CSS y JavaScript y actúa como proxy hacia `ORDERS_SERVICE_URL=http://orders-service:3001`. El nombre `orders-service` se resuelve dentro de la red de Docker Compose o mediante el Service de Kubernetes; no es una dirección que el navegador deba resolver.

Son dos servicios para mostrar que cada componente tiene su propia imagen y puede desplegarse y escalarse de forma independiente. Orders Service no guarda pedidos: crea un identificador con UUID para cada solicitud y responde con `processedBy`, el hostname de la instancia que la atendió. Al escalar a tres réplicas, los pedidos pueden mostrar distintos nombres de Pod. El reparto no garantiza una alternancia exacta.

## Estructura

```text
frontend/                  Servidor Express, proxy y página web
orders-service/            API Express sin estado
kubernetes/                Deployments y Services
.github/workflows/         Publicación de las dos imágenes en GHCR
docs/workshop-commands.md  Guion interno paso a paso
compose.yml                Aplicación completa en Docker Compose
```

Cada servicio tiene su propio `Dockerfile`, `package.json`, `package-lock.json` y `.dockerignore`.

## Recorrido Docker — Play with Docker

En una sesión de [Play with Docker](https://labs.play-with-docker.com/), agrega una instancia y clona el repositorio:

```sh
git clone https://github.com/kendallchacon/docker-kubernetes-lab.git
cd docker-kubernetes-lab
```

Primero se construyen las imágenes por separado y se conectan los contenedores con una red Docker:

```sh
docker build -t lab-orders ./orders-service
docker build -t lab-frontend ./frontend
docker image ls
docker network create lab-network
docker run -d --name orders-service --network lab-network lab-orders
docker run -d --name frontend --network lab-network -p 8080:8080 \
  -e ORDERS_SERVICE_URL=http://orders-service:3001 lab-frontend
docker ps
```

Abre el puerto **8080** en Play with Docker y realiza un pedido. También puedes probar el proxy desde la terminal:

```sh
curl -s -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"product":"mouse","quantity":1}'
docker logs orders-service
docker logs frontend
docker rm -f frontend orders-service
docker network rm lab-network
```

Después se muestra el equivalente con Compose. Compose crea una red compartida y usa los nombres de servicio como hostnames:

```sh
docker compose up --build -d
docker compose ps
```

Abre de nuevo el puerto **8080** y realiza otro pedido. Para limpiar:

```sh
docker compose down
```

El guion completo y las observaciones esperadas están en [docs/workshop-commands.md](docs/workshop-commands.md).

## Recorrido Kubernetes — Killercoda

Las imágenes deben existir en GHCR y ser **públicas** antes de desplegar. En un escenario de Kubernetes de [Killercoda](https://killercoda.com/):

```sh
git clone https://github.com/kendallchacon/docker-kubernetes-lab.git
cd docker-kubernetes-lab
kubectl get nodes
kubectl apply -f kubernetes/
kubectl rollout status deployment/orders-service
kubectl rollout status deployment/frontend
kubectl get deployments
kubectl get pods
kubectl get services
```

Para abrir la tienda, ejecuta en una terminal y mantenla abierta:

```sh
kubectl port-forward --address 0.0.0.0 service/frontend 8080:8080
```

Abre el puerto **8080** de Killercoda. Si el escenario no muestra una pestaña de tráfico para el puerto, prueba desde una segunda terminal con `curl http://localhost:8080/health` y el `POST /api/orders` del recorrido Docker.

En otra terminal, escala únicamente Orders Service y envía varios pedidos:

```sh
kubectl scale deployment orders-service --replicas=3
kubectl rollout status deployment/orders-service
kubectl get pods -l app=orders-service
kubectl get pods -l app=frontend
```

La interfaz muestra `processedBy` para cada respuesta. Para observar la recuperación automática, elige un Pod de Orders Service de la lista y elimínalo:

```sh
kubectl delete pod NOMBRE_DEL_POD
kubectl get pods -l app=orders-service -w
```

Detén la observación con `Ctrl+C`; el Deployment vuelve a mantener tres réplicas. La aplicación no implementa esa recuperación. Al terminar, detén `port-forward` con `Ctrl+C` y limpia:

```sh
kubectl delete -f kubernetes/
```

## Publicación de imágenes

El workflow [.github/workflows/publish-images.yml](.github/workflows/publish-images.yml) se ejecuta al hacer push a `main`. Publica `latest` y una etiqueta corta basada en SHA para cada imagen:

- `ghcr.io/kendallchacon/docker-kubernetes-lab-frontend:latest`
- `ghcr.io/kendallchacon/docker-kubernetes-lab-orders-service:latest`

Usa `GITHUB_TOKEN` con permisos `contents: read` y `packages: write`; no necesita secretos manuales. **Después de la primera publicación, cambia la visibilidad de ambos paquetes de GHCR a pública en la configuración de paquetes de GitHub.** Killercoda necesita descargarlos sin autenticación. Si el repositorio o propietario cambia, actualiza las dos referencias de imagen de Kubernetes y el workflow.

## Solución de problemas

| Síntoma | Comprobación |
| --- | --- |
| La página abre, pero el pedido falla | Revisa `docker logs frontend` y `docker logs orders-service`, o `kubectl logs deployment/frontend` y `kubectl logs deployment/orders-service`. Verifica `ORDERS_SERVICE_URL`. |
| `ImagePullBackOff` en Killercoda | Confirma que el workflow publicó ambas imágenes y que ambos paquetes GHCR son públicos. |
| El puerto 8080 no abre | Comprueba `docker ps` o que `kubectl port-forward` sigue activo, y utiliza el acceso al puerto del entorno web. |
| Se ven pocos nombres de Pod | Espera a que las tres réplicas estén Ready y envía más pedidos. La distribución no es una secuencia fija. |
| El Pod eliminado reaparece con otro nombre | Es el comportamiento esperado del Deployment: restaura el número de réplicas deseado. |
