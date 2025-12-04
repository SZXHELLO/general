package com.generals.service;

import com.generals.model.GameRecord;
import com.generals.model.User;
import com.generals.repository.GameRecordRepository;
import com.generals.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LeaderboardService {

    @Autowired
    private GameRecordRepository gameRecordRepository;

    @Autowired
    private UserRepository userRepository;

    // ================ 保存游戏记录并更新用户统计 ================
    @Transactional
    public void saveGameRecord(User user, boolean won, int territory, int army, int towers, int enemiesDefeated, int movesCount, long gameTime) {
        // 1. 创建游戏记录
        GameRecord record = new GameRecord(user);
        record.setResult(won ? "WIN" : "LOSE");
        record.setFinalTerritory(territory);
        record.setFinalArmy(army);
        record.setTowersCaptured(towers);
        record.setEnemiesDefeated(enemiesDefeated);
        record.setMovesCount(movesCount);
        record.setDurationSeconds((int) gameTime);
        record.setEndTime(LocalDateTime.now());

        // 保存游戏记录
        gameRecordRepository.save(record);

        // 2. 更新用户统计
        updateUserStats(user, won, territory, towers, record.getDurationSeconds());
    }

    // ================ 更新用户统计信息 ================
    private void updateUserStats(User user, boolean won, int territory, int towers, int duration) {
        // 更新基础统计
        user.setTotalGames(user.getTotalGames() + 1);

        if (won) {
            user.setTotalWins(user.getTotalWins() + 1);

            // 更新速攻榜数据（最快胜利时间）
            if (user.getFastestWin() == null || duration < user.getFastestWin()) {
                user.setFastestWin(duration);
            }
        } else {
            user.setTotalLosses(user.getTotalLosses() + 1);
        }

        // 更新领土榜数据（最大领土）
        if (territory > user.getMaxTerritory()) {
            user.setMaxTerritory(territory);
        }

        // 更新塔王榜数据（最多塔数）
        if (towers > user.getMaxTowers()) {
            user.setMaxTowers(towers);
        }

        // 保存更新后的用户
        userRepository.save(user);
    }

    // ================ 排行榜查询方法（使用简单方法名） ================

    /**
     * 获取速攻榜（最快胜利时间）
     */
    public List<Map<String, Object>> getFastestWinLeaderboard(int limit) {
        List<GameRecord> records = gameRecordRepository.findFastestWins();
        List<GameRecord> limitedRecords = records.stream()
                .limit(limit)
                .toList();
        return convertToLeaderboard(limitedRecords, "durationSeconds");
    }

    /**
     * 获取领土榜（最大领土）
     */
    public List<Map<String, Object>> getTerritoryLeaderboard(int limit) {
        List<GameRecord> records = gameRecordRepository.findMaxTerritory();
        List<GameRecord> limitedRecords = records.stream()
                .limit(limit)
                .toList();
        return convertToLeaderboard(limitedRecords, "finalTerritory");
    }

    /**
     * 获取塔王榜（最多塔数）
     */
    public List<Map<String, Object>> getTowersLeaderboard(int limit) {
        List<GameRecord> records = gameRecordRepository.findMaxTowers();
        List<GameRecord> limitedRecords = records.stream()
                .limit(limit)
                .toList();
        return convertToLeaderboard(limitedRecords, "towersCaptured");
    }

    // ================ 辅助方法 ================
    private List<Map<String, Object>> convertToLeaderboard(List<GameRecord> records, String valueField) {
        return records.stream().map(record -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("username", record.getUser().getUsername());
            entry.put("value", getValueByField(record, valueField));
            entry.put("gameTime", record.getEndTime());
            return entry;
        }).toList();
    }

    private Object getValueByField(GameRecord record, String field) {
        return switch (field) {
            case "durationSeconds" -> record.getDurationSeconds();
            case "finalTerritory" -> record.getFinalTerritory();
            case "towersCaptured" -> record.getTowersCaptured();
            default -> null;
        };
    }
}