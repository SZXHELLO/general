package com.generals.controller;

import com.generals.model.User;
import com.generals.service.LeaderboardService;
import com.generals.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private UserService userService;

    // ================ 获取排行榜数据 ================

    /**
     * 获取速攻榜（最快胜利）
     * GET /api/stats/fastest?limit=10
     */
    @GetMapping("/fastest")
    public ResponseEntity<Map<String, Object>> getFastestLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {

        try {
            List<Map<String, Object>> leaderboard =
                    leaderboardService.getFastestWinLeaderboard(limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("type", "fastest");
            response.put("data", leaderboard);
            response.put("count", leaderboard.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("获取速攻榜失败"));
        }
    }

    /**
     * 获取领土榜（最大领土）
     * GET /api/stats/territory?limit=10
     */
    @GetMapping("/territory")
    public ResponseEntity<Map<String, Object>> getTerritoryLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {

        try {
            List<Map<String, Object>> leaderboard =
                    leaderboardService.getTerritoryLeaderboard(limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("type", "territory");
            response.put("data", leaderboard);
            response.put("count", leaderboard.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("获取领土榜失败"));
        }
    }

    /**
     * 获取塔王榜（最多塔数）
     * GET /api/stats/towers?limit=10
     */
    @GetMapping("/towers")
    public ResponseEntity<Map<String, Object>> getTowersLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {

        try {
            List<Map<String, Object>> leaderboard =
                    leaderboardService.getTowersLeaderboard(limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("type", "towers");
            response.put("data", leaderboard);
            response.put("count", leaderboard.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("获取塔王榜失败"));
        }
    }

    // ================ 获取用户个人统计 ================

    /**
     * 获取用户个人统计
     * GET /api/stats/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        try {
            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("userId", user.getId());
            stats.put("username", user.getUsername());
            stats.put("totalGames", user.getTotalGames());
            stats.put("totalWins", user.getTotalWins());
            stats.put("totalLosses", user.getTotalLosses());
            stats.put("fastestWin", user.getFastestWin());
            stats.put("maxTerritory", user.getMaxTerritory());
            stats.put("maxTowers", user.getMaxTowers());

            // 计算胜率
            if (user.getTotalGames() > 0) {
                double winRate = (double) user.getTotalWins() / user.getTotalGames() * 100;
                stats.put("winRate", String.format("%.1f%%", winRate));
            } else {
                stats.put("winRate", "0%");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("获取用户统计失败"));
        }
    }

    // ================ 保存游戏记录 ================

    /**
     * 保存游戏记录
     * POST /api/stats/record
     */
    @PostMapping("/record")
    public ResponseEntity<Map<String, Object>> saveGameRecord(
            @RequestBody GameRecordRequest request) {

        try {
            User user = userService.findById(request.getUserId());
            if (user == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("用户不存在"));
            }

            leaderboardService.saveGameRecord(
                    user,
                    request.isWon(),
                    request.getTerritory(),
                    request.getArmy(),
                    request.getTowers(),
                    request.getEnemiesDefeated(),
                    request.getMovesCount(),
                    request.getGameTime()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "游戏记录保存成功");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("保存游戏记录失败"));
        }
    }

    // ================ 辅助方法 ================
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }

    // ================ 内部类：游戏记录请求 ================
    public static class GameRecordRequest {
        private Long userId;
        private boolean won;
        private int territory;
        private int army;
        private int towers;
        private int enemiesDefeated;
        private int movesCount;
        private long gameTime;

        // Getter和Setter方法
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public boolean isWon() { return won; }
        public void setWon(boolean won) { this.won = won; }

        public int getTerritory() { return territory; }
        public void setTerritory(int territory) { this.territory = territory; }

        public int getArmy() { return army; }
        public void setArmy(int army) { this.army = army; }

        public int getTowers() { return towers; }
        public void setTowers(int towers) { this.towers = towers; }

        public int getEnemiesDefeated() { return enemiesDefeated; }
        public void setEnemiesDefeated(int enemiesDefeated) { this.enemiesDefeated = enemiesDefeated; }

        public int getMovesCount() { return movesCount; }
        public void setMovesCount(int movesCount) { this.movesCount = movesCount; }
        public long getGameTime() { return gameTime; }
        public void setGameTime(long gameTime) { this.gameTime = gameTime; }


    }
}