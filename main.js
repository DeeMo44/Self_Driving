const carCanvas = document.getElementById('carCanvas');
carCanvas.width = 200;
const networkCanvas = document.getElementById('networkCanvas');
networkCanvas.width = 300;

const carCtx = carCanvas.getContext('2d');
const networkCtx = networkCanvas.getContext('2d');

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9)

const N = 600
const cars = generateCars(N)
let bestCar = cars[0]
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(
      localStorage.getItem("bestBrain")
    )
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.15)
    }
  }

}

let lastTrafficSpawnTime = 0;
// standard cars before random cars
const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2)
]

animate();

function save() {
  localStorage.setItem("bestBrain",
    JSON.stringify(bestCar.brain)
  )
  location.reload();
}
function discard() {
  localStorage.removeItem("bestBrain")
  location.reload();
}
function refresh(){
  location.reload()
}

function generateCars(N) {
  const cars = []
  for (let i = 0; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"))
  }
  return cars
}

function animate(time) {
  // Update and spawn dummy cars
  for (let i = traffic.length - 1; i >= 0; i--) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, [])
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }

  // Calculate the time difference since the last traffic spawn
  const timeDiff = time - lastTrafficSpawnTime;

  // Check if one second has passed since the last traffic spawn
  if (timeDiff >= 3000) {
    // Spawn a new "DUMMY" traffic at a random lane
    const randomLane = Math.floor(Math.random() * 3);
    const newTraffic = new Car(road.getLaneCenter(randomLane), (bestCar.y - 900), 30, 50, "DUMMY", 2);
    traffic.push(newTraffic);

  // Decide whether to spawn a second car (double)
  const shouldSpawnDouble = Math.random() < 2 / 3; // 2 out of 3 lanes have a chance of double car
  if (shouldSpawnDouble) {
    const randomLaneDouble = Math.floor(Math.random() * 3);
    const newTrafficDouble = new Car(road.getLaneCenter(randomLaneDouble), bestCar.y - 900, 30, 50, "DUMMY", 2);
    traffic.push(newTrafficDouble);
  }
    // Update the last traffic spawn time
    lastTrafficSpawnTime = time;
  }

  bestCar = cars.find(
    c => c.y == Math.min(
      ...cars.map(c => c.y)
    )
  )

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;
  carCtx.save();
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7)
  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, 'red')
  }
  carCtx.globalAlpha = 0.1
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx, 'blue');
  }
  carCtx.globalAlpha = 1
  bestCar.draw(carCtx, 'green', true);
  carCtx.restore();
  networkCtx.lineDashOffset = -time / 50
  Visualizer.drawNetwork(networkCtx, bestCar.brain)
  requestAnimationFrame(animate);
}