let canvas, ctx;

window.onload = function() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", documentKeyDown);
    document.addEventListener("keyup", documentKeyUp);
    document.addEventListener("mousedown", documentMouseDown);
    document.addEventListener("mousemove", documentMouseMove);

    requestAnimationFrame(render);
}
let keysPressed = {};
let mouseX = 0, mouseY = 0;
function documentMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}
function documentKeyDown(e) {
    if(playerControlling) {
        keysPressed[e.key] = true;
    }
}
function documentKeyUp(e) {
    keysPressed[e.key] = false;
}
function documentMouseDown(e) {
    // Check if we clicked any of the players. If we clicked one, set selectedPlayer to that player. If we didn't click any, set selectedPlayer to null.
    for(let i = 0; i < players.length; i++) {
        let player = players[i];
        
        let startX = (player.x * playerSpeedScaleX) + 1;
        let endX = (player.x * playerSpeedScaleX) + tileWidth - 1;
        let startY = (player.y * playerSpeedScaleY) - tileHeight * 2 + 1;
        let endY = (player.y * playerSpeedScaleY) - 1;

        if(rectanglesColliding(startX, startY, endX, endY, e.clientX, e.clientY, e.clientX, e.clientY)) {
            selectedPlayer = i;
            return;
        }
    }
    selectedPlayer = null;
}

let levelHeight = 12, levelWidth = 48;
let tileHeight, tileWidth;

let tileMap = [];

let tiles = [
    {x: 10, y: 10, type: "wall"},
    {x: 13, y: 9, type: "wall"},
    {x: 15, y: 5, type: "wall"},
    {x: 16, y: 3, type: "wall"},
    {x: 16, y: 10, type: "wall"},
    {x: 19, y: 10, type: "wall"},
    {x: 22, y: 9, type: "wall"},
    {x: 23, y: 10, type: "wall"},
    {x: 26, y: 9, type: "wall"},

    {x: 27, y: 10, type: "wall"},
    {x: 27, y: 9, type: "wall"},
    {x: 27, y: 8, type: "wall"},
    {x: 27, y: 7, type: "wall"},
    {x: 27, y: 6, type: "wall"},
    {x: 27, y: 5, type: "wall"},
    {x: 27, y: 4, type: "wall"},
    {x: 27, y: 3, type: "wall"},
    {x: 27, y: 2, type: "wall"},
    {x: 27, y: 1, type: "wall"},
    {x: 27, y: 0, type: "wall"},

    {x: 0, y: 10, type: "wall"},
    {x: 0, y: 9, type: "wall"},
    {x: 0, y: 8, type: "wall"},
    {x: 0, y: 7, type: "wall"},
    {x: 0, y: 6, type: "wall"},
    {x: 0, y: 5, type: "wall"},
    {x: 0, y: 4, type: "wall"},
    {x: 0, y: 3, type: "wall"},
    {x: 0, y: 2, type: "wall"},
    {x: 0, y: 1, type: "wall"},
    {x: 0, y: 0, type: "wall"},
]

// Init tilemap
for(let y = 0; y < levelHeight; y++) {
    tileMap.push([]);
    for(let x = 0; x < levelWidth; x++) {
        if(y > levelHeight - 2) {
            tileMap[y].push({ type: "ground" });
        } else {
            let found = null;
            for(var i = 0; i < tiles.length; i++) {
                if(tiles[i].x === x && tiles[i].y === y) {found = tiles[i]; break}
            }
            if(found !== null) {
                tileMap[y].push({ type: found.type });
            } else {
                tileMap[y].push({ type: "blank" });
            }
        }
    }
}

let tileData = {
    "blank": {
        color: "#ffffff",
        collision: false
    },
    "ground": {
        color: "#0000ff",
        collision: true
    },
    "wall": {
        color: "#555555",
        collision: true
    }
}

let numberOfPlayers = 100;

let players = [];
// A number or null
let selectedPlayer = null;

let playerControlling = false;

// Random number, just played with it until I liked it.
// NOTE: magic numbers are fun :)
let gravityY = 10, gravityX = 0;
let playerMass = 0.1; // kg
let collisionStep = 1;

// Again, random number.
let initialPlayerSpeedScale = 1 / 50;
let playerSpeedScaleX, playerSpeedScaleY;

// --------------------- EVOLUTION DATA ---------------------
let crossOverProbability = 0.5;
let mutationProbability = 01;
let advancePercent = 0.3;
let lowAdvancePercent = 0.1;
let fitnessProbabilityPerPlayer = 0.5;

let networkLayers = 2;

let generationTimeout = 10000; // In milliseconds

// Do not modify this stuff
let currentGeneration = 0;
let generationTime = 0;

let networkOutputs = [
    {type: "pressingW"},
    {type: "pressingA"},
    {type: "pressingS"},
    {type: "pressingD"}
];

let networkInputs = [
    {type: "x", default: 0},
    {type: "y", default: 0},
    {type: "xVelocity", default: 0},
    {type: "yVelocity", default: 0},

    // Distance to the closest wall in a direction
    // From the bottom of the player
    {type: "distLeft", default: 0},
    // From the bottom of the player
    {type: "distRight", default: 0},
    // From the top of the player
    {type: "distTop", default: 0},
    // From the bottom of the player
    {type: "distBottom", default: 0},
    // Diagonal distance
    {type: "distTopLeft", default: 0},
    // Diagonal distance
    {type: "distTopRight", default: 0},
    // Diagonal distance
    {type: "distBottomLeft", default: 0},
    // Diagonal distance
    {type: "distBottomRight", default: 0},
    // From the top of the player
    {type: "distLeftTop", default: 0},
    // From the top of the player
    {type: "distRightTop", default: 0},

    // Always equal to 1
    {type: "bias", default: 1}
];

function generatePlayers() {
    players = [];
    for(var i = 0; i < numberOfPlayers; i++) {
        players.push({
            name: `Player ${i + 1}`,
            x: 100,
            y: 400, //550 is floor
            xVel: 0,
            yVel: 0,
            network: createRandomNetwork(),
            finished: false,
            fitness: 0,
            keysPressed: {}
        });
    }
}

function evolvePlayers() {
    let sortedPlayers = players.sort((p1, p2) => p1.fitness - p2.fitness);
    
    let newPlayers = [];

    for(let i = 0; i < Math.floor(sortedPlayers.length * advancePercent); i++) {
        newPlayers.push(sortedPlayers[i]);
        sortedPlayers.splice(i, 1);
    }

    for(let i = 0; i < Math.floor(sortedPlayers.length * lowAdvancePercent); i++) {
        let index = Math.floor(Math.random() * sortedPlayers.length);

        newPlayers.push(sortedPlayers[index]);
        sortedPlayers.splice(index, 1);
    }

    while(newPlayers.length < numberOfPlayers) {
        if(Math.random() < crossOverProbability) {
            let p1 = getRandomPlayer(sortedPlayers, fitnessProbabilityPerPlayer);
            let p2 = getRandomPlayer(sortedPlayers, fitnessProbabilityPerPlayer);

            while(p1 === p2) {
                p2 = getRandomPlayer(sortedPlayers, fitnessProbabilityPerPlayer);
            }

            let childNetwork = crossOver(p1.network, p2.network);

            let child = p1;
            child.network = childNetwork;
            child.name = `Cross-over ${newPlayers.length + 1}`;
            newPlayers.push(child);
        } else {
            let player = getRandomPlayer(sortedPlayers, fitnessProbabilityPerPlayer);
            player.name = `Copy ${newPlayers.length + 1}`;
            newPlayers.push(player);
        }
    }

    for(let i = 0; i < newPlayers.length; i++) {
        newPlayer = newPlayers[i];
        newPlayer.network = mutate(newPlayer.network, mutationProbability);

        newPlayers[i] = newPlayer;
        newPlayers[i].x = 100;
        newPlayers[i].y = 400;
        newPlayers[i].xVel = 0;
        newPlayers[i].yVel = 0;
        
        newPlayers[i].finished = false;
        newPlayers[i].keysPressed = {};
    }

    players = JSON.parse(JSON.stringify(newPlayers));
}

function getRandomPlayer(players, probabilityPerPlayer) {
    let sortedPlayers = players.sort((p1, p2) => p1.fitness - p2.fitness);

    let pickedPlayer;
    let pickIndex = 0;
    while(!pickedPlayer) {
        if(Math.random() < probabilityPerPlayer) {
            pickedPlayer = sortedPlayers[pickIndex];
        }
        pickIndex++;
        if(pickIndex >= sortedPlayers.length) {
            pickedPlayer = sortedPlayers[0];
        }
    }

    return pickedPlayer;
}

function crossOver(p1, p2) {
    let index = Math.floor(Math.random() * p1.length);
    let child = p1.slice(0, index).concat(p2.slice(index));

    // Check if anything connects to nonexistent neurons
    for(let i = 0; i < child.length; i++) {
        for(let c = 0; c < child[i].length; c++) {
            for(let n = 0; n < child[i][c].connections.length; n++) {
                if(child[i][c].connections[n].bias) {
                    if(child[i][c].connections[n].to >= child[child[i][c].connections[n].toLayer].length) {
                        child[i][c].connections.splice(n, 1);
                    }
                } else {
                    if(child[i][c].connections[n].to >= child[i + 1].length) {
                        child[i][c].connections.splice(n, 1);
                    }
                }
            }
        }
    }

    return child;
}

function mutate(network, mutationRate) {
    for(let i = 1; i < network.length - 1; i++) {
        switch(Math.floor(Math.random() * (3 / mutationRate))) {
            case 0:
                // Add a new neuron
                let neuronIndex = Math.floor(Math.random() * network[i].length);
                let newNeuron = {
                    connections: [],
                    value: 0
                };

                network[i].splice(neuronIndex + 1, 0, newNeuron);
                break;
            case 1:
                // Remove a neuron
                if(network[i].length <= 1) continue;
                let neuron = Math.floor(Math.random() * network[i].length);
                network[i].splice(neuron, 1);
                break;
            case 2:
                // Modify the neuron's connections
                for(let n = 0; n < network[i].length; n++) {
                    switch(Math.floor(Math.random() * (3 / mutationRate))) {
                        case 0:
                            // Add a connection
                            let connectionIndex = Math.floor(Math.random() * network[i][n].connections.length);
                            let newConnection = {
                                to: Math.floor(Math.random() * network[i + 1].length),
                                weight: Math.random() * 2 - 1
                            };

                            network[i][n].connections.splice(connectionIndex + 1, 0, newConnection);
                            break;
                        case 1:
                            // Remove a connection
                            let connectionIndex2 = Math.floor(Math.random() * network[i][n].connections.length);
                            network[i][n].connections.splice(connectionIndex2, 1);
                            break;
                        case 2:
                            // Change a connection
                            for(let c = 0; c < network[i][n].connections.length; c++) {
                                network[i][n].connections[c].weight = Math.random() * 2 - 1;
                            }
                            break;
                        default:
                            // Do nothing
                            break;
                    }
                }
                
                // Remove any duplicate connections
                for(let n = 0; n < network.length; n++) {
                    for(let i = 0; i < network[n].length; i++) {
                        for(let c = 0; c < network[n][i].connections.length; c++) {
                            for(let d = c + 1; d < network[n][i].connections.length; d++) {
                                if(network[n][i].connections[c].to === network[n][i].connections[d].to) {
                                    network[n][i].connections.splice(d, 1);
                                    d--;
                                }
                            }
                        }
                    }
                }
                break;
            default:
                // Do nothing
                break;
        }
    }

    // Check if anything connects to nonexistent neurons
    for(let i = 0; i < network.length; i++) {
        for(let c = 0; c < network[i].length; c++) {
            for(let n = 0; n < network[i][c].connections.length; n++) {
                if(network[i][c].connections[n].bias) {
                    if(network[i][c].connections[n].to >= network[network[i][c].connections[n].toLayer].length) {
                        network[i][c].connections.splice(n, 1);
                    }
                } else {
                    if(network[i][c].connections[n].to >= network[i + 1].length) {
                        network[i][c].connections.splice(n, 1);
                    }
                }
            }
        }
    }

    return network;
}

generatePlayers();

function createRandomNetwork() {
    let network = [];
    let layerNeurons = [];
    for(let i = 0; i < networkLayers + 2; i++) {
        if(i === 0) {
            layerNeurons.push(networkInputs.length);
        } else if(i === networkLayers + 1) {
            layerNeurons.push(networkOutputs.length);
        } else {
            layerNeurons.push(Math.floor(Math.random() * 3) + 1);
        }
    }
    for(let n = 0; n < networkLayers + 2; n++) {
        let neurons = [];
        if(n === 0) {
            for(let i = 0; i < networkInputs.length; i++) {
                let neuron = {
                    connections: [],
                    value: 0
                }
                if(i === networkInputs.length - 1) {
                    for(let l = 0; l < networkLayers; l++) {
                        for(let c = 0; c < Math.floor(Math.random() * 3); c++) {
                            neuron.connections.push({
                                to: Math.floor(Math.random() * layerNeurons[l + 1]),
                                bias: true,
                                toLayer: l + 1,
                                weight: Math.random() * 2 - 1
                            });
                        }
                    }
                } else {
                    for(let c = 0; c < Math.floor(Math.random() * 3); c++) {
                        neuron.connections.push({
                            to: Math.floor(Math.random() * layerNeurons[n + 1]),
                            weight: Math.random() * 2 - 1
                        });
                    }
                }
                neurons.push(neuron);
            }
        } else if(n === networkLayers + 1) {
            for(let i = 0; i < networkOutputs.length; i++) {
                let neuron = {
                    connections: [],
                    value: 0
                };
                neurons.push(neuron);
            }
        } else {
            for(let i = 0; i < layerNeurons[n]; i++) {
                let neuron = {
                    connections: [],
                    value: 0
                };
                for(let c = 0; c < Math.floor(Math.random() * 5); c++) {
                    neuron.connections.push({
                        to: Math.floor(Math.random() * layerNeurons[n + 1]),
                        weight: Math.random() * 2 - 1
                    });
                }
                neurons.push(neuron);
            }
        }
        network.push(neurons);
    }

    // Remove any duplicate connections
    for(let n = 0; n < network.length; n++) {
        for(let i = 0; i < network[n].length; i++) {
            for(let c = 0; c < network[n][i].connections.length; c++) {
                for(let d = c + 1; d < network[n][i].connections.length; d++) {
                    if(network[n][i].connections[c].to === network[n][i].connections[d].to) {
                        network[n][i].connections.splice(d, 1);
                        d--;
                    }
                }
            }
        }
    }

    return network;
}

let lastTime = 0;
function render(time) {
    let timeDiff = time - lastTime;
    lastTime = time;

    generationTime += timeDiff;

    let deltaTime = timeDiff / (1 / 60) / 1000;

    // if(playerControlling && selectedPlayer !== null) {
    //     let playerGround = {
    //         x: players[selectedPlayer].x,
    //         y: players[selectedPlayer].y + 1
    //     };
    //     if(keysPressed["w"] && collidingWithTile(playerGround)) players[selectedPlayer].yVel -= 30;
    //     if(keysPressed["a"]) players[selectedPlayer].xVel -= 1;
    //     if(keysPressed["s"]) players[selectedPlayer].yVel += 1;
    //     if(keysPressed["d"]) players[selectedPlayer].xVel += 1;
    // }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    tileHeight = canvas.height / levelHeight;
    tileWidth = tileHeight;

    playerSpeedScaleX = initialPlayerSpeedScale * tileWidth;
    playerSpeedScaleY = initialPlayerSpeedScale * tileHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let y = 0; y < tileMap.length; y++) {
        for(let x = 0; x < tileMap[y].length; x++) {
            ctx.fillStyle = tileData[tileMap[y][x].type].color;
            ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
        }
    }

    for(let i = 0; i < players.length; i++) {
        // Evaluate the neural network
        let inputs = [];
        for(let n = 0; n < networkInputs.length; n++) {
            let playerXTile = Math.floor(players[i].x / tileWidth);
            let playerYTile = Math.floor(players[i].y / tileHeight);
            switch(networkInputs[n].type) {
                case "x":
                    inputs.push(players[i].x / tileWidth);
                    break;
                case "y":
                    inputs.push(players[i].y / tileHeight);
                    break;
                case "xVelocity":
                    inputs.push(players[i].xVel / tileWidth);
                    break;
                case "xVelocity":
                    inputs.push(players[i].yVel / tileHeight);
                    break;
                case "distLeft":
                    let distLeft = -1;
                    for(let x = playerXTile - 1; x >= 0; x--) {
                        if(tileData[tileMap[playerYTile + 1][x].type].collision) {
                            distLeft = playerXTile - x;
                            break;
                        }
                    }
                    inputs.push(distLeft);
                    break;
                case "distRight":
                    let distRight = -1;
                    for(let x = playerXTile + 1; x < tileMap[playerYTile + 1].length; x++) {
                        if(tileData[tileMap[playerYTile + 1][x].type].collision) {
                            distRight = x - playerXTile - 2;
                            break;
                        }
                    }
                    inputs.push(distRight);
                    break;
                case "distTop":
                    let distTop = -1;
                    for(let y = playerYTile - 1; y >= 0; y--) {
                        if(tileData[tileMap[y][playerXTile].type].collision) {
                            distTop = playerYTile - y;
                            break;
                        }
                    }
                    inputs.push(distTop);
                    break;
                case "distBottom":
                    let distBottom = -1;
                    for(let y = playerYTile + 1; y < tileMap.length; y++) {
                        if(tileData[tileMap[y][playerXTile].type].collision) {
                            distBottom = y - playerYTile - 2;
                            break;
                        }
                    }
                    inputs.push(distBottom);
                    break;
                case "distTopLeft":
                    let distTopLeft = -1;
                    for(let y = playerYTile - 1, x = playerXTile - 1; y >= 0 && x >= 0; y--, x--) {
                        if(tileData[tileMap[y][x].type].collision) {
                            distTopLeft = Math.sqrt(Math.pow(playerXTile - x, 2) + Math.pow(playerYTile - y, 2));
                            break;
                        }
                    }
                    inputs.push(distTopLeft);
                    break;
                case "distTopRight":
                    let distTopRight = -1;
                    for(let y = playerYTile - 1, x = playerXTile + 1; y >= 0 && x < tileMap[playerYTile + 1].length; y--, x++) {
                        if(tileData[tileMap[y][x].type].collision) {
                            distTopRight = Math.sqrt(Math.pow(x - playerXTile - 1, 2) + Math.pow(playerYTile - y, 2));
                            break;
                        }
                    }
                    inputs.push(distTopRight);
                    break;
                case "distBottomLeft":
                    let distBottomLeft = -1;
                    for(let y = playerYTile + 1, x = playerXTile - 1; y < tileMap.length && x >= 0; y++, x--) {
                        if(tileData[tileMap[y][x].type].collision) {
                            distBottomLeft = Math.sqrt(Math.pow(playerXTile - x, 2) + Math.pow(y - playerYTile - 1, 2)) - 1;
                            break;
                        }
                    }
                    inputs.push(distBottomLeft);
                    break;
                case "distBottomRight":
                    let distBottomRight = -1;
                    for(let y = playerYTile + 1, x = playerXTile + 1; y < tileMap.length && x < tileMap[playerYTile + 1].length; y++, x++) {
                        if(tileData[tileMap[y][x].type].collision) {
                            distBottomRight = Math.sqrt(Math.pow(x - playerXTile - 2, 2) + Math.pow(y - playerYTile - 2, 2));
                            break;
                        }
                    }
                    inputs.push(distBottomRight);
                    break;
                case "distLeftTop":
                    let distLeftTop = -1;
                    for(let x = playerXTile - 1; x >= 0; x--) {
                        if(tileData[tileMap[playerYTile][x].type].collision) {
                            distLeftTop = playerXTile - x;
                            break;
                        }
                    }
                    inputs.push(distLeftTop);
                    break;
                case "distRightTop":
                    let distRightTop = -1;
                    for(let x = playerXTile + 1; x < tileMap[playerYTile].length; x++) {
                        if(tileData[tileMap[playerYTile][x].type].collision) {
                            distRightTop = x - playerXTile - 2;
                            break;
                        }
                    }
                    inputs.push(distRightTop);
                    break;
                default:
                    inputs.push(networkInputs[n].default);
            }
        }

        for(let n = 0; n < players[i].network[0].length; n++) {
            players[i].network[0][n].value = inputs[n];
        }

        // Set all neurons' values to 0
        for(let n = 1; n < players[i].network.length; n++) {
            for(let m = 0; m < players[i].network[n].length; m++) {
                players[i].network[n][m].value = 0;
            }
        }

        // Add the value of each neuron times the weight of it's connection to the next layer
        for(let n = 0; n < players[i].network.length; n++) {
            for(let m = 0; m < players[i].network[n].length; m++) {
                // Loop through all the connections of the current neuron
                let connections = players[i].network[n][m].connections;
                for(let c = 0; c < connections.length; c++) {
                    let value = connections[c].weight * players[i].network[n][m].value;
                    value = value > 0 ? 1 : 0;
                    if(connections[c].bias) {
                        if(players[i].network[connections[c].toLayer][connections[c].to] === undefined) continue;
                        players[i].network[connections[c].toLayer][connections[c].to].value = value;
                    } else {
                        if(players[i].network[n + 1][connections[c].to] === undefined) continue;
                        players[i].network[n + 1][connections[c].to].value = value;
                    }
                }

                if(n === players[i].network.length - 1) {
                    let output = players[i].network[n][m].value;
                    switch(networkOutputs[m].type) {
                        case "pressingW":
                            players[i].keysPressed["w"] = output;
                            break;
                        case "pressingA":
                            players[i].keysPressed["a"] = output;
                            break;
                        case "pressingS":
                            players[i].keysPressed["s"] = output;
                            break;
                        case "pressingD":
                            players[i].keysPressed["d"] = output;
                            break;
                    }
                }
            }
        }

        let playerGround = {
            x: players[i].x,
            y: players[i].y + 1
        };
        if(players[i].keysPressed["w"] && collidingWithTile(playerGround)) players[i].yVel -= 30;
        if(players[i].keysPressed["a"]) players[i].xVel -= 1;
        if(players[i].keysPressed["s"]) players[i].yVel += 1;
        if(players[i].keysPressed["d"]) players[i].xVel += 1;

        if(generationTime > generationTimeout) {
            generationTime = 0;
            currentGeneration++;
            for(let p = 0; p < players.length; p++) {
                players[p].fitness = calcFitness(players[p]);
            }
            evolvePlayers();
            break;
        }

        // Drag force
        // Fd = -1/2 * Cd * A * rho * v * v
        var Cd = 0.47; // Dimensionless
        var rho = 1.22; // kg / m^3
        var A = 0.2; //Area, should be the real area of the rectangle but for now 0.2 is fine

        var Fx = -0.5 * Cd * A * rho * players[i].xVel * players[i].xVel * players[i].xVel / Math.abs(players[i].xVel);
        var Fy = -0.5 * Cd * A * rho * players[i].yVel * players[i].yVel * players[i].yVel / Math.abs(players[i].yVel);

        Fx = (isNaN(Fx) ? 0 : Fx);
        Fy = (isNaN(Fy) ? 0 : Fy);
                
        // Calculate acceleration ( F = ma )
        var ax = gravityX + (Fx / playerMass);
        var ay = gravityY + (Fy / playerMass);

        players[i].yVel += ay * (1 / 60);
        players[i].xVel += ax * (1 / 60);

        let oldY = players[i].y, oldX = players[i].x;

        if(players[i].yVel > 0) {
            for(let s = 0; s < (players[i].yVel * deltaTime) / collisionStep; s++) {
                let player = {
                    x: players[i].x,
                    y: players[i].y + s * collisionStep + 1
                }
                if(collidingWithTile(player)) {
                    players[i].yVel = 0;
                    players[i].y = oldY + s * collisionStep;
                    break;
                }
            }
        } else if(players[i].yVel < 0) {
            for(let s = 0; s > (players[i].yVel * deltaTime) / collisionStep; s--) {
                let player = {
                    x: players[i].x,
                    y: players[i].y + s * collisionStep - 1
                }
                if(collidingWithTile(player)) {
                    players[i].yVel = 0;
                    players[i].y = oldY + s * collisionStep;
                    break;
                }
            }
        }
        players[i].y += players[i].yVel * deltaTime;

        if(players[i].xVel > 0) {
            for(let s = 0; s < (players[i].xVel * deltaTime) / collisionStep; s++) {
                let player = {
                    x: players[i].x + s * collisionStep + 1,
                    y: players[i].y
                }
                if(collidingWithTile(player)) {
                    players[i].xVel = 0;
                    players[i].x = oldX + s * collisionStep;
                    break;
                }
            }
        } else if(players[i].xVel < 0) {
            for(let s = 0; s > (players[i].xVel * deltaTime) / collisionStep; s--) {
                let player = {
                    x: players[i].x + s * collisionStep - 1,
                    y: players[i].y
                }
                if(collidingWithTile(player)) {
                    players[i].xVel = 0;
                    players[i].x = oldX + s * collisionStep;
                    break;
                }
            }
        }
        players[i].x += players[i].xVel * deltaTime;

        ctx.fillStyle = players[i].color ? players[i].color : "#ff0000";
        ctx.fillRect(players[i].x * playerSpeedScaleX, players[i].y * playerSpeedScaleY, tileWidth, -tileHeight * 2);

        ctx.fillStyle = "#000000";
        ctx.font = '30px Arial';
        ctx.textAlign = "center";
        ctx.fillText(players[i].name, (players[i].x * playerSpeedScaleX) + (tileWidth / 2), (players[i].y * playerSpeedScaleY) - (tileHeight * 2) - 15);
    }

    ctx.fillStyle = "#000000";
    ctx.font = '30px Arial';
    ctx.textAlign = "left";
    ctx.fillText(`Delta time: ${Math.round(deltaTime * 100) / 100}`, 20, 40);
    ctx.fillText(`Generation: ${currentGeneration}`, 20, 80);
    let fitnessArray = players.map(p => p.fitness);
    let highestFitness = Math.max(...fitnessArray);
    ctx.fillText(`Top fitness: ${Math.floor(highestFitness * 100) / 100}`, 20, 120);

    if(selectedPlayer !== null) {
        ctx.fillStyle = "#000000";
        ctx.font = '30px Arial';
        ctx.textAlign = "right";
        ctx.fillText(`${players[selectedPlayer].name}`, canvas.width - 20, 40);
        ctx.fillText(`X: ${Math.round(players[selectedPlayer].x * 100) / 100}`, canvas.width - 20, 80);
        ctx.fillText(`Y: ${Math.round(players[selectedPlayer].y * 100) / 100}`, canvas.width - 20, 120);
        ctx.fillText(`X velocity: ${Math.round(players[selectedPlayer].xVel * 100) / 100}`, canvas.width - 20, 160);
        ctx.fillText(`Y velocity: ${Math.round(players[selectedPlayer].yVel * 100) / 100}`, canvas.width - 20, 200);
        ctx.fillText(`Fitness: ${Math.round(calcFitness(players[selectedPlayer]) * 10) / 10}`, canvas.width - 20, 240);

        // Render the network
        let networkHeight = 300;
        let networkWidth = 500;

        let playerNetwork = players[selectedPlayer].network;

        let layerWidth = networkWidth / playerNetwork.length;
        let widthOffset = canvas.width / 2 - networkWidth / 3;

        for(let i = 0; i < playerNetwork.length; i++) {
            let layer = playerNetwork[i];
            let layerHeight = networkHeight / layer.length;
            let nodeWidth = layerWidth * i;
            let heightOffset = layerHeight / 2;
            for(let j = 0; j < layer.length; j++) {
                let node = layer[j];
                let nodeHeight = layerHeight * j;

                for(let k = 0; k < node.connections.length; k++) {
                    let connection = node.connections[k];
                    let toNode = connection.to;

                    let toLayerIndex;
                    if(connection.bias) {
                        toLayerIndex = connection.toLayer;
                    } else {
                        toLayerIndex = i + 1;
                    }
                    
                    let toNodeWidth = layerWidth * toLayerIndex;

                    let toLayer = playerNetwork[toLayerIndex];
                    let toLayerHeight = networkHeight / toLayer.length;
                    let toNodeHeight = toLayerHeight * toNode;
                    let toHeightOffset = toLayerHeight / 2;

                    ctx.beginPath();
                    ctx.moveTo(widthOffset + nodeWidth, 20 + nodeHeight + heightOffset);
                    ctx.lineTo(widthOffset + toNodeWidth, 20 + toNodeHeight + toHeightOffset);
                    if(connection.weight > 0) {
                        ctx.strokeStyle = "#0000ff";
                    } else {
                        ctx.strokeStyle = "#ff0000";
                    }
                    let widthMultiplier = 3;
                    ctx.lineWidth = Math.abs(connection.weight) * widthMultiplier;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(widthOffset + nodeWidth, 20 + nodeHeight + heightOffset, 8, 0, 2 * Math.PI);
                if(pointInCircle(mouseX, mouseY, widthOffset + nodeWidth, 20 + nodeHeight + heightOffset, 15)) {
                    ctx.font = '20px Arial';
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#000000";
                    ctx.fillText(`${Math.floor(node.value * 100) / 100}`, widthOffset + nodeWidth + 10, 25 + nodeHeight + heightOffset);
                    ctx.fillStyle = "#222222";
                } else {
                    let clampedValue = Math.min(Math.max(node.value, 0), 1);
                    let greyRGB = [100, 100, 100];
                    let colorRGB = [100, 200, 100];

                    let color = `rgb(${lerp(greyRGB[0], colorRGB[0], clampedValue)}, ${lerp(greyRGB[1], colorRGB[1], clampedValue)}, ${lerp(greyRGB[2], colorRGB[2], clampedValue)})`;
                    ctx.fillStyle = color;
                }
                ctx.fill();

                if(i === 0) {
                    ctx.fillStyle = "#000000";
                    ctx.font = '20px Arial';
                    ctx.textAlign = "right";
                    ctx.fillText(`${networkInputs[j].type}`, widthOffset + nodeWidth - 10, 25 + nodeHeight + heightOffset);
                } else if(i === playerNetwork.length - 1) {
                    ctx.fillStyle = "#000000";
                    ctx.font = '20px Arial';
                    ctx.textAlign = "left";
                    ctx.fillText(`${networkOutputs[j].type}`, widthOffset + nodeWidth + 10, 25 + nodeHeight + heightOffset);
                }
            }
        }
    }

    requestAnimationFrame(render);
}

function collidingWithTile(player) {
    let startX = (player.x * playerSpeedScaleX) + 1;
    let endX = (player.x * playerSpeedScaleX) + tileWidth - 1;
    let startY = (player.y * playerSpeedScaleY) - tileHeight * 2 + 1;
    let endY = (player.y * playerSpeedScaleY) - 1;

    // ctx.fillStyle = "#00ffff44";
    // ctx.fillRect(startX, startY, endX - startX + 50, endY - startY);
    
    let tileStartX = Math.floor(startX / tileWidth);
    let tileEndX = Math.ceil(endX / tileWidth);
    let tileStartY = Math.floor(startY / tileHeight);
    let tileEndY = Math.ceil(endY / tileHeight);

    // ctx.fillStyle = "#00ff0044";
    // ctx.fillRect(tileStartX * tileWidth, tileStartY * tileHeight, (tileEndX - tileStartX) * tileWidth, (tileEndY - tileStartY) * tileHeight);

    if(tileStartX < 0) tileStartX = 0;
    if(tileStartY < 0) tileStartY = 0;
    if(tileEndX > tileMap[0].length) tileEndX = tileMap[0].length;
    if(tileEndY > tileMap.length) tileEndY = tileMap.length;

    for(let y = tileStartY; y < tileEndY; y++) {
        for(let x = tileStartX; x < tileEndX; x++) {
            if(tileData[tileMap[y][x].type].collision) {
                if(rectanglesColliding(startX, startY, endX, endY, x * tileWidth, y * tileHeight, (x + 1) * tileWidth, (y + 1) * tileHeight)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function rectanglesColliding(rect1X1, rect1Y1, rect1X2, rect1Y2, rect2X1, rect2Y1, rect2X2, rect2Y2) {
    return (rect1X1 < rect2X2 && rect1X2 > rect2X1 && rect1Y1 < rect2Y2 && rect1Y2 > rect2Y1);
}

function calcFitness(player) {
    return player.x / 2;
}

function pointInCircle(x, y, cx, cy, radius) {
    return (x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius;
}

function lerp(a, b, t) {
    return a + t * (b - a);
}