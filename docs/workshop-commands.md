# Guion interno de comandos del taller

**Pendiente:** validar estos comandos directamente en Play with Docker y Killercoda antes de copiarlos definitivamente al repositorio `docker-kubernetes-presentation`. La disponibilidad de los accesos web a puertos depende del escenario elegido.

## Recorrido Docker — Play with Docker

Abrir [Play with Docker](https://labs.play-with-docker.com/) y crear una instancia. Ejecutar los pasos en orden.

| Paso y objetivo | Comando | Qué observar | Concepto |
| --- | --- | --- | --- |
| 1. Obtener el laboratorio | `git clone https://github.com/kendallchacon/docker-kubernetes-lab.git && cd docker-kubernetes-lab` | Carpetas de ambos servicios y `compose.yml`. | Código fuente compartido. |
| 2. Construir la API | `docker build -t lab-orders ./orders-service` | Docker procesa el Dockerfile y crea `lab-orders`. | Dockerfile → imagen. |
| 3. Construir el frontend | `docker build -t lab-frontend ./frontend` | Segunda imagen independiente. | Separación de componentes. |
| 4. Listar imágenes | `docker image ls` | Aparecen `lab-orders` y `lab-frontend`. | Imágenes locales. |
| 5. Crear una red | `docker network create lab-network` | Docker devuelve el ID de la red. | Red entre contenedores. |
| 6. Iniciar la API | `docker run -d --name orders-service --network lab-network lab-orders` | ID del contenedor. | Contenedor y nombre DNS interno. |
| 7. Iniciar frontend | `docker run -d --name frontend --network lab-network -p 8080:8080 -e ORDERS_SERVICE_URL=http://orders-service:3001 lab-frontend` | ID del contenedor; puerto 8080 publicado. | Variables de entorno y publicación de puertos. |
| 8. Inspeccionar contenedores | `docker ps` | Dos contenedores activos; solo el frontend publica un puerto al exterior. | Aislamiento de la API. |
| 9. Abrir la tienda | Abrir el puerto **8080** desde la interfaz de Play with Docker. | Tres productos y formulario de pedido. | Navegador → frontend. |
| 10. Realizar un pedido | Elegir producto y cantidad, pulsar **Realizar pedido**. | ID, estado y `processedBy`. | Frontend → Orders Service. |
| 11. Probar por terminal | `curl -s -X POST http://localhost:8080/api/orders -H 'Content-Type: application/json' -d '{"product":"mouse","quantity":1}'` | JSON con `processedBy` igual al hostname del contenedor. | API HTTP y proxy. |
| 12. Revisar logs | `docker logs orders-service` y `docker logs frontend` | Mensajes de inicio y posibles errores. | Observabilidad básica. |
| 13. Detener y eliminar | `docker rm -f frontend orders-service` | Desaparecen los contenedores. | Ciclo de vida. |
| 14. Eliminar red | `docker network rm lab-network` | Red manual eliminada. | Limpieza de recursos. |
| 15. Levantar con Compose | `docker compose up --build -d` | Compose crea red y dos servicios. | Configuración declarativa de varios contenedores. |
| 16. Revisar y probar | `docker compose ps`; abrir puerto **8080** y realizar un pedido. | Ambos servicios activos y respuesta del pedido. | Misma aplicación con menos comandos. |
| 17. Limpiar Compose | `docker compose down` | Contenedores y red de Compose eliminados. | Ciclo de vida declarativo. |

Si el navegador no está disponible, el `curl` del paso 11 también funciona durante la parte de Compose. No es necesario publicar el puerto 3001 porque el frontend comparte la red con la API.

## Recorrido Kubernetes — Killercoda

Antes de empezar, confirmar que las dos imágenes del workflow ya se publicaron en GHCR y que los paquetes son públicos. Abrir un escenario de Kubernetes en [Killercoda](https://killercoda.com/).

| Paso y objetivo | Comando | Qué observar | Concepto |
| --- | --- | --- | --- |
| 1. Verificar clúster | `kubectl get nodes` | Al menos un nodo `Ready`. | Clúster disponible. |
| 2. Obtener código | `git clone https://github.com/kendallchacon/docker-kubernetes-lab.git && cd docker-kubernetes-lab` | Directorio `kubernetes/`. | Manifiestos declarativos. |
| 3. Desplegar | `kubectl apply -f kubernetes/` | Dos Deployments y dos Services creados. | Estado deseado. |
| 4. Esperar disponibilidad | `kubectl rollout status deployment/orders-service && kubectl rollout status deployment/frontend` | Ambos rollouts completados. | Readiness y disponibilidad. |
| 5. Revisar Deployments | `kubectl get deployments` | Una réplica Ready por servicio. | Controladores. |
| 6. Revisar Pods | `kubectl get pods -o wide` | Un Pod frontend y un Pod orders-service. | Instancias de aplicación. |
| 7. Revisar Services | `kubectl get services` | `frontend` en 8080 y `orders-service` en 3001 como ClusterIP. | Descubrimiento y red estable. |
| 8. Exponer frontend temporalmente | `kubectl port-forward --address 0.0.0.0 service/frontend 8080:8080` en una terminal que quede abierta. | Puerto local 8080 conectado al Service. | Acceso sin LoadBalancer. |
| 9. Probar aplicación | Abrir puerto **8080** en Killercoda; enviar un pedido. Desde otra terminal: `curl -s -X POST http://localhost:8080/api/orders -H 'Content-Type: application/json' -d '{"product":"mouse","quantity":1}'`. | Respuesta con nombre del Pod en `processedBy`. | Comunicación por Services. |
| 10. Escalar solo la API | `kubectl scale deployment orders-service --replicas=3` y `kubectl rollout status deployment/orders-service` | Tres réplicas listas. | Escalado independiente. |
| 11. Observar réplicas | `kubectl get pods -l app=orders-service` y `kubectl get pods -l app=frontend` | Tres Pods de Orders Service y uno de frontend. | Estado deseado por Deployment. |
| 12. Enviar varios pedidos | Repetir el pedido desde la web o el `curl` anterior. | `processedBy` puede variar entre Pods; no hay orden garantizado. | Distribución mediante Service. |
| 13. Eliminar un Pod | Elegir un nombre del paso 11 y ejecutar `kubectl delete pod NOMBRE_DEL_POD`. | El Pod se elimina. | Fallo simulado. |
| 14. Observar recuperación | `kubectl get pods -l app=orders-service -w` y detener con `Ctrl+C`. | El Deployment crea otro Pod hasta regresar a tres réplicas. | Autorrecuperación real de Kubernetes. |
| 15. Limpiar | Detener `port-forward` con `Ctrl+C`; ejecutar `kubectl delete -f kubernetes/`. | Recursos del laboratorio eliminados. | Limpieza declarativa. |

El comando de port-forward ocupa una terminal: abrir una segunda para las acciones siguientes. Si el escenario no ofrece una pestaña web para el puerto 8080, usar la segunda terminal y `curl`. Mantener el port-forward activo mientras se prueba la aplicación.

Para ver qué Pod procesó cada pedido, ejecutar `kubectl logs -l app=orders-service --prefix=true --tail=50`. Para seguir los pedidos en vivo mientras se envían desde la tienda, usar `kubectl logs -l app=orders-service --prefix=true --tail=10 -f --max-log-requests=10`. `Ctrl + C` detiene el seguimiento en vivo.
