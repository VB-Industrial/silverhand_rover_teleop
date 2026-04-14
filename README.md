# silverhand_rover_teleop

Веб-UI и телепульт для SilverHand rover.

Проект сделан в той же логике, что и `silverhand_arm_teleop`:
- `Preact + TypeScript + Vite`
- шлюз `WebSocket + JSON` на стороне робота
- локальное mock/state store для smoke-проверки
- сервисная панель для WS, mock и fault-сценариев

Сейчас пакет ориентирован на rover teleop без `nav2`.
Цель текущей итерации:
- UI оператора для ровера
- ручное управление `WASD`
- переключение режимов мышью
- поддержка gamepad/joystick
- отправка `cmd_vel`-подобных команд через websocket gateway
- локальная mock-серверная часть для отладки UI без реальной rover-серверной части

## Требования

- Ubuntu 24.04
- Node.js `20.19+` или `22.12+`

## Запуск UI

```bash
cd ~/silver_ws/src/silverhand_rover_teleop/ui
npm install
npm run dev -- --host 0.0.0.0 --port 4174
```

Открыть:

- `http://localhost:4174/`
- `http://<YOUR_HOST_IP>:4174/`

## Сборка

```bash
cd ~/silver_ws/src/silverhand_rover_teleop/ui
npm install
npm run build
```

## Запуск собранного UI

```bash
cd ~/silver_ws/src/silverhand_rover_teleop
./silverhand_rover_teleop_start.sh
```

По умолчанию:

- `http://0.0.0.0:4174`

Можно переопределить:

```bash
HOST=0.0.0.0 PORT=4175 ./silverhand_rover_teleop_start.sh
```

## Подключение к серверной части

GUI подключается к шлюзу websocket на стороне робота.
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

Если серверная часть ещё не готова, можно включить локальный mock в сервисной панели.

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

Для дальнейшего моста к серверной части удобно держать ту же семантику, что и в rover controller layer:

- `ABS_X` -> steering
- `ABS_Y` -> speed
- `ABS_Z` -> селектор режима
- кнопки читаются отдельным массивом `buttons[0..11]`

Во браузерном прототипе это отражено через browser `Gamepad API`:

- `axes[0]` -> steering
- `axes[1]` -> speed
- `axes[2]` -> выбор режима движения
- `buttons[0]` -> stop
- `buttons[2]` -> headlights

## systemd

Шаблон systemd-сервиса:

- `systemd/system/silverhand-rover-teleop.service`

Установка:

```bash
sudo install -Dm644 systemd/system/silverhand-rover-teleop.service /etc/systemd/system/silverhand-rover-teleop.service
sudo systemctl daemon-reload
```

Запуск:

```bash
sudo systemctl enable --now silverhand-rover-teleop.service
```
