import json
import os
import psycopg2

SCHEMA = 't_p17117659_rating_counter_app_1'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """GET — возвращает игры и игроков за один запрос. POST — сохраняет игру."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, data FROM {SCHEMA}.games ORDER BY (data->>'createdAt') DESC")
        game_rows = cur.fetchall()
        cur.execute(
            f'SELECT id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin FROM {SCHEMA}.players ORDER BY points DESC'
        )
        player_rows = cur.fetchall()
        conn.close()

        games = []
        for row in game_rows:
            g = row[1]
            g['id'] = row[0]
            games.append(g)

        players = [_player_to_dict(r) for r in player_rows]

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'games': games, 'players': players})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        game = body.get('game')
        if not game or not game.get('id'):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'game.id обязателен'})}

        game_id = game['id']
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f'''INSERT INTO {SCHEMA}.games (id, data, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
                RETURNING id''',
            (game_id, json.dumps(game))
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}


def _player_to_dict(row):
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
