-- ============================================================
-- Seed data for projects skeleton
-- Provides one parent project + two sub-projects + a few blocks,
-- so the new /projects pages render something visible during development.
-- Run AFTER 001_projects_schema.sql.
-- Safe to re-run: clears existing seed rows by slug prefix first.
-- ============================================================

-- Clear previous seed rows (matches by slug prefix to avoid touching real data)
delete from projects where slug like 'uav-vio%';

-- Top-level project: UAV-VIO research
insert into projects (slug, parent_id, title, summary, tags, tech_stack, metrics, links, published, order_index)
values
  ('uav-vio',
   null,
   'UAV Visual-Inertial Odometry',
   '碩士研究：在無人機上整合視覺與 IMU 感測器，自製資料集驗證 VIO 演算法。',
   array['UAV', 'Research', 'Embedded'],
   array['ROS', 'C++', 'OpenCV', 'Jetson Nano'],
   '{"rmse_cm": 3, "fps": 30}'::jsonb,
   '{"github": "https://github.com/jamesswim"}'::jsonb,
   true,
   1);

-- Sub-project: dataset collection
insert into projects (slug, parent_id, title, summary, tags, tech_stack, published, order_index)
values
  ('uav-vio/dataset-collection',
   (select id from projects where slug = 'uav-vio'),
   'Dataset Collection in the Field',
   '在學校操場手動操控無人機飛行，自建一份同步的視覺與 IMU 資料集。',
   array['UAV', 'Dataset'],
   array['ROS bag', 'IMU', 'Camera calibration'],
   true,
   1);

-- Sub-project: VIO algorithm
insert into projects (slug, parent_id, title, summary, tags, tech_stack, published, order_index)
values
  ('uav-vio/algorithm',
   (select id from projects where slug = 'uav-vio'),
   'VIO Algorithm Implementation',
   '研究並實作 visual-inertial fusion 演算法，調校至能在 Jetson Nano 即時運行。',
   array['UAV', 'Algorithm'],
   array['C++', 'Eigen', 'OpenCV', 'Kalman Filter'],
   true,
   2);

-- Blocks for the parent (hub) project
insert into project_blocks (project_id, type, content, order_index)
values
  ((select id from projects where slug = 'uav-vio'),
   'markdown',
   '{"text": "## 研究背景\n\n碩士論文聚焦於無人機在 GPS 失效或受限環境下的定位問題。透過融合視覺與慣性感測器，可以在不依賴外部訊號的前提下，估計載具的 6 自由度姿態。\n\n本專案的價值不只在演算法本身，而是把整個系統從零組起來：感測器選型、硬體整合、現場資料收集、嵌入式部署都自己跑過一遍。"}'::jsonb,
   1),
  ((select id from projects where slug = 'uav-vio'),
   'metric',
   '{"label": "Position RMSE", "value": "3 cm", "context": "在校內 50m × 50m 飛行軌跡"}'::jsonb,
   2);

-- Blocks for the leaf (dataset-collection)
insert into project_blocks (project_id, type, content, order_index)
values
  ((select id from projects where slug = 'uav-vio/dataset-collection'),
   'markdown',
   '{"text": "## 為什麼自建資料集\n\n公開資料集（例如 EuRoC、TUM VI）的飛行模式、相機曝光、IMU 規格與我研究的場景差距太大，演算法在公開資料集表現很好，搬到我自己的硬體上就崩。所以乾脆自己飛、自己錄。\n\n## 流程\n\n1. 相機與 IMU 同步校正\n2. 操場手動飛行錄製 ROS bag\n3. 後處理對齊時間戳"}'::jsonb,
   1);

-- Blocks for the leaf (algorithm)
insert into project_blocks (project_id, type, content, order_index)
values
  ((select id from projects where slug = 'uav-vio/algorithm'),
   'markdown',
   '{"text": "## 演算法設計\n\n採用緊耦合（tightly-coupled）的視覺-慣性融合架構，把 IMU pre-integration 結果與視覺 feature 觀測一起放進非線性最佳化框架求解。\n\n## 嵌入式優化\n\nJetson Nano 算力有限，在不犧牲精度的前提下做了幾項調整：\n\n- 特徵點數量上限\n- 關鍵幀篩選策略\n- 後端最佳化視窗大小"}'::jsonb,
   1);
