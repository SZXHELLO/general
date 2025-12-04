package com.generals.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_records")
public class GameRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================ 关联用户 ================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ================ 游戏基本信息 ================
    @Column(name = "game_result", nullable = false)
    private String result; // WIN, LOSE, DRAW

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds; // 游戏时长（秒）

    // ================ 排行榜相关数据 ================
    @Column(name = "final_territory", nullable = false)
    private Integer finalTerritory; // 最终领土数

    @Column(name = "final_army", nullable = false)
    private Integer finalArmy; // 最终军队数

    @Column(name = "towers_captured", nullable = false)
    private Integer towersCaptured = 0; // 占领塔数（用于塔王榜）

    @Column(name = "enemies_defeated", nullable = false)
    private Integer enemiesDefeated = 0; // 击败敌人数

    @Column(name = "moves_count", nullable = false)
    private Integer movesCount = 0; // 操作次数

    // ================ 构造函数 ================
    public GameRecord() {
        this.startTime = LocalDateTime.now();
    }

    public GameRecord(User user) {
        this();
        this.user = user;
    }

    // ================ Getter和Setter方法 ================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Integer getFinalTerritory() { return finalTerritory; }
    public void setFinalTerritory(Integer finalTerritory) {
        this.finalTerritory = finalTerritory;
    }

    public Integer getFinalArmy() { return finalArmy; }
    public void setFinalArmy(Integer finalArmy) { this.finalArmy = finalArmy; }

    public Integer getTowersCaptured() { return towersCaptured; }
    public void setTowersCaptured(Integer towersCaptured) {
        this.towersCaptured = towersCaptured;
    }

    public Integer getEnemiesDefeated() { return enemiesDefeated; }
    public void setEnemiesDefeated(Integer enemiesDefeated) {
        this.enemiesDefeated = enemiesDefeated;
    }

    public Integer getMovesCount() { return movesCount; }
    public void setMovesCount(Integer movesCount) { this.movesCount = movesCount; }

    // ================ 实用方法 ================
    public void calculateDuration() {
        if (endTime != null && startTime != null) {
            this.durationSeconds = (int) java.time.Duration.between(startTime, endTime).getSeconds();
        }
    }

    public void setGameEnd() {
        this.endTime = LocalDateTime.now();
        calculateDuration();
    }
}
