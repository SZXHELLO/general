package com.generals.repository;

import com.generals.model.GameRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRecordRepository extends JpaRepository<GameRecord, Long> {

    // 根据用户ID查找游戏记录
    List<GameRecord> findByUserIdOrderByEndTimeDesc(Long userId);

    // 查找用户获胜的游戏记录
    List<GameRecord> findByUserIdAndResultOrderByEndTimeDesc(Long userId, String result);

    // ================ 排行榜查询方法（使用简单名称） ================

    // 速攻榜：查询最快胜利的前10名（只统计获胜的游戏）
    @Query("SELECT g FROM GameRecord g WHERE g.result = 'WIN' ORDER BY g.durationSeconds ASC")
    List<GameRecord> findFastestWins();

    // 领土榜：查询最大领土的前10名
    @Query("SELECT g FROM GameRecord g ORDER BY g.finalTerritory DESC")
    List<GameRecord> findMaxTerritory();

    // 塔王榜：查询最多塔数的前10名
    @Query("SELECT g FROM GameRecord g ORDER BY g.towersCaptured DESC")
    List<GameRecord> findMaxTowers();
}
