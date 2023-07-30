const carCanvas = document.getElementById('carCanvas');
carCanvas.width = 200;
const networkCanvas = document.getElementById('networkCanvas');
networkCanvas.width = 300;

const carCtx = carCanvas.getContext('2d');
const networkCtx = networkCanvas.getContext('2d');

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9)

const N = 300
const cars = generateCars(N)
let bestCar = cars[0]
if (localStorage.getItem("bestBrain")) {
  console.log(localStorage)
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(
      localStorage.getItem("bestBrain")
    )
    if(i!=0){
      NeuralNetwork.mutate(cars[i].brain,0.05)
    }
  }

}

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

const maxDummyCars = 4
function generateRandomNegativeNumber(min, max) {
  return -Math.random() * (max - min) - min;
}
function generateDummyCar(x, y) {
  return new Car(x, y, 30, 50, "DUMMY", 2);
}
function spawnDummyCar(aiYPosition, minDummyDistance, minAICarDistance, maxDummyCars) {
  if (traffic.length >= maxDummyCars) {
    return; // Don't spawn more cars if the maximum limit has been reached
  }
  const randomLane = Math.floor(Math.random() * 3); // Assuming there are 3 lanes (0, 1, 2)
  let randomYOffset = generateRandomNegativeNumber(100, 1000); // Adjust the range as needed
  while (Math.abs(randomYOffset) < minDummyDistance || Math.abs(randomYOffset + aiYPosition) < minAICarDistance) {
    // Ensure a minimum distance between dummy cars and between the AI car and the closest dummy car
    randomYOffset = generateRandomNegativeNumber(100, 1000);
  }

  const dummyY = aiYPosition + randomYOffset;
  traffic.push(generateDummyCar(road.getLaneCenter(randomLane), dummyY));
}

animate();

function save() {
  localStorage.setItem("bestBrain",
    JSON.stringify(bestCar.brain)
  )
}

function discard() {
  localStorage.removeItem("bestBrain")
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
    
    // If a dummy car goes below the canvas, remove it from the array
    if (traffic[i].y > carCanvas.height) {
      traffic.splice(i, 1);
    }
  }

  const aiYPosition = bestCar.y; // Store the AI car's Y position
  const minDummyDistance = 500; // Adjust the minimum distance between dummy cars as needed
  const minAICarDistance = 1000; // Adjust the minimum distance between the AI car and the closest dummy car as needed

  // Spawn new dummy car every X frames (you can adjust this as needed)
  const spawnFrequency = 100;
  if (Math.random() < 1 / spawnFrequency) {
    spawnDummyCar(aiYPosition, minDummyDistance, minAICarDistance, maxDummyCars); // Pass the required parameters
  }

  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, [])
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
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