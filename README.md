# silverhand_rover_teleop

Web GUI and teleoperation frontend for the SilverHand rover.

Проект сделан в той же логике, что и `silverhand_arm_teleop`:
- `Preact + TypeScript + Vite`
- robot-side `WebSocket + JSON` gateway
- локальный mock/state store для smoke test
- сервисная панель для WS, mock и fault-сценариев

Сейчас пакет ориентирован на rover teleop без `nav2`.
Цель текущей итерации:
- UI оператора для ровера
- ручное управление `WASD`
- переключение режимов мышью
- поддержка gamepad/joystick
- отправка `cmd_vel`-подобных команд через websocket gateway
- локальный mock backend для отладки UI без реального rover backend

## Что нужно

- Ubuntu 24.04
- Node.js `20.19+` или `22.12+`

## Запуск UI

```bash
cd /home/robot/silver_ws/src/silverhand_rover_teleop/ui
npm install
npm run dev -- --host 0.0.0.0 --port 4174
```

Открыть:

- `http://localhost:4174/`
- `http://<YOUR_HOST_IP>:4174/`

## Build

```bash
cd /home/robot/silver_ws/src/silverhand_rover_teleop/ui
npm install
npm run build
```

## Запуск собранного UI

```bash
cd /home/robot/silver_ws/src/silverhand_rover_teleop
./silverhand_rover_teleop_start.sh
```

По умолчанию:

- `http://0.0.0.0:4174`

Можно переопределить:

```bash
HOST=0.0.0.0 PORT=4175 ./silverhand_rover_teleop_start.sh
```

## Подключение к backend

GUI подключается к robot-side websocket gateway.
Базовый URL:

```text
ws://127.0.0.1:8765
```

Пока ожидаемый контракт ориентирован на rover runtime:

- `hello`
- `ping`
- `cmd_vel`
- `stop`
- `estop`
- `reset_estop`
- `set_drive_mode`

Входящие сообщения, которые UI уже умеет принимать:

- `hello_ack`
- `pong`
- `odometry`
- `rover_state`
- `battery_state`
- `fault_state`

Если backend ещё не готов, можно включить локальный mock в сервисной панели.

## Управление

- `W` / `S`: линейная скорость вперёд / назад
- `A` / `D`: поворот влево / вправо
- `Shift`: boost
- `Space`: быстрый stop
- `E`: переключение режима в следующий
- `Q`: переключение режима в предыдущий
- gamepad left stick: линейная и угловая скорость
- gamepad selector axis: выбор режима
- gamepad axis 0: руление, axis 1: ход, axis 2: выбор передачи
- gamepad button 0: stop
- gamepad button 2: фары

## Замечания по джойстику

Для дальнейшего backend bridge удобно держать ту же семантику, что и в `/home/robot/projects/roma`:

- `ABS_X` -> steering
- `ABS_Y` -> speed
- `ABS_Z` -> селектор режима
- кнопки читаются отдельным массивом `buttons[0..11]`

Во frontend-прототипе это отражено через browser `Gamepad API`:

- `axes[0]` -> steering
- `axes[1]` -> speed
- `axes[2]` -> выбор режима движения
- `buttons[0]` -> stop
- `buttons[2]` -> headlights

## systemd

User-service:

- `systemd/user/silverhand-rover-teleop.service`

Установка:

```bash
mkdir -p ~/.config/systemd/user
cp /home/robot/silver_ws/src/silverhand_rover_teleop/systemd/user/silverhand-rover-teleop.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now silverhand-rover-teleop.service
```
