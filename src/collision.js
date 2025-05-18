// 這是 蛇 共用判定的程式// 檢查是否撞牆（地圖邊界）
export function checkWallCollision(pos, boardSize) {
  return pos.x < 0 || pos.y < 0 || pos.x >= boardSize || pos.y >= boardSize;
}

// 檢查是否撞到自己
export function checkSelfCollision(pos, snake) {
  return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// 檢查敵人是否咬到玩家（頭咬到身體）
export function checkEnemyBitePlayer(enemySnake, playerSnake) {
  const enemyHead = enemySnake[0];
  return playerSnake.some(segment => segment.x === enemyHead.x && segment.y === enemyHead.y);
}
