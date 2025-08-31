export const USER_QUERY = `
     SELECT
        phpbb_user_group.user_id AS id,
        user.username,
        user.user_avatar AS avatar,
        user.group_id AS main_group,
        GROUP_CONCAT(DISTINCT phpbb_user_group.group_id ORDER BY phpbb_user_group.group_id SEPARATOR ',') AS permissions,
        user.user_email AS email,
        user.user_password AS password
    FROM phpbb_user_group
    INNER JOIN (
        SELECT 
            phpbb_users.user_id, 
            phpbb_users.username, 
            phpbb_users.user_avatar, 
            phpbb_users.user_email, 
            phpbb_users.group_id, 
            phpbb_users.user_password 
        FROM phpbb_users
    ) AS user 
        ON user.user_id = phpbb_user_group.user_id 
        AND phpbb_user_group.group_id BETWEEN 9 AND 14 
        AND user.user_id = ?
     GROUP BY
        user.user_id,
        user.username,
        user.user_avatar,
        user.group_id,
        user.user_email,
        user.user_password;
`;

export const USER_QUERY_BY_EMAIL = `
    SELECT 
        phpbb_user_group.user_id AS id,
        user.username,
        user.user_avatar AS avatar,
        user.group_id AS main_group,
        GROUP_CONCAT(DISTINCT phpbb_user_group.group_id ORDER BY phpbb_user_group.group_id SEPARATOR ',') AS permissions,
        user.user_email AS email,
        user.user_password AS password
    FROM phpbb_user_group
    INNER JOIN (
        SELECT 
            phpbb_users.user_id,
            phpbb_users.username,
            phpbb_users.user_avatar,
            phpbb_users.user_email,
            phpbb_users.group_id,
            phpbb_users.user_password 
        FROM phpbb_users
    ) AS user 
        ON user.user_id = phpbb_user_group.user_id 
        AND phpbb_user_group.group_id BETWEEN 9 AND 14 
        AND user.user_email = ?
    GROUP BY
        user.user_id,
        user.username,
        user.user_avatar,
        user.group_id,
        user.user_email,
        user.user_password;
`;
