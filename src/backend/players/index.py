import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Получение списка всех игроков и обновление профиля."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin FROM players ORDER BY points DESC')
        rows = cur.fetchall()
        conn.close()
        players = [_row_to_dict(r) for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'players': players})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        player_id = body.get('id')
        updates = body.get('updates', {})

        if not player_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'id обязателен'})}

        allowed = {'name': 'name', 'avatar': 'avatar', 'points': 'points', 'wins': 'wins', 'losses': 'losses', 'gamesPlayed': 'games_played'}
        sets = []
        vals = []
        for key, col in allowed.items():
            if key in updates:
                sets.append(f'{col} = %s')
                vals.append(updates[key])

        if not sets:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных для обновления'})}

        vals.append(int(player_id))
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f'UPDATE players SET {", ".join(sets)} WHERE id = %s RETURNING id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin',
            vals
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Игрок не найден'})}

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'player': _row_to_dict(row)})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}


def _row_to_dict(row):
    return {
        'id': str(row[0]),
        'name': row[1],
        'email': row[2],
        'avatar': row[3] or '',
        'points': row[4],
        'wins': row[5],
        'losses': row[6],
        'gamesPlayed': row[7],
        'joinDate': str(row[8]),
        'isAdmin': row[9],
        'password': '',
    }
