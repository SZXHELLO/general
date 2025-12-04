package com.generals.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20个字符之间")
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ================ 排行榜字段开始 ================
    @Column(name = "total_games", columnDefinition = "INT DEFAULT 0")
    private Integer totalGames = 0;

    @Column(name = "total_wins", columnDefinition = "INT DEFAULT 0")
    private Integer totalWins = 0;

    @Column(name = "total_losses", columnDefinition = "INT DEFAULT 0")
    private Integer totalLosses = 0;

    @Column(name = "fastest_win")  // 最快胜利时间（秒），null表示尚未获胜
    private Integer fastestWin;

    @Column(name = "max_territory", columnDefinition = "INT DEFAULT 0")  // 单局最大领土
    private Integer maxTerritory = 0;

    @Column(name = "max_towers", columnDefinition = "INT DEFAULT 0")  // 单局最多塔数
    private Integer maxTowers = 0;
    // ================ 排行榜字段结束 ================

    public User() {
        this.createdAt = LocalDateTime.now();
    }

    public User(String username, String password) {
        this();
        this.username = username;
        this.password = password;
    }

    // Getter和Setter方法...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // ================ 排行榜字段Getter/Setter开始 ================
    public Integer getTotalGames() { return totalGames; }
    public void setTotalGames(Integer totalGames) { this.totalGames = totalGames; }

    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }

    public Integer getTotalLosses() { return totalLosses; }
    public void setTotalLosses(Integer totalLosses) { this.totalLosses = totalLosses; }

    public Integer getFastestWin() { return fastestWin; }
    public void setFastestWin(Integer fastestWin) { this.fastestWin = fastestWin; }

    public Integer getMaxTerritory() { return maxTerritory; }
    public void setMaxTerritory(Integer maxTerritory) { this.maxTerritory = maxTerritory; }

    public Integer getMaxTowers() { return maxTowers; }
    public void setMaxTowers(Integer maxTowers) { this.maxTowers = maxTowers; }
    // ================ 排行榜字段Getter/Setter结束 ================
}