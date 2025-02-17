-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at
    before update on profiles
    for each row
    execute procedure update_updated_at_column();

create trigger update_beats_updated_at
    before update on beats
    for each row
    execute procedure update_updated_at_column();

create trigger update_collaborations_updated_at
    before update on collaborations
    for each row
    execute procedure update_updated_at_column();

-- Create indexes for better performance
create index beats_created_by_idx on beats(created_by);
create index beats_created_at_idx on beats(created_at desc);
create index comments_beat_id_idx on comments(beat_id);
create index likes_beat_id_idx on likes(beat_id);
create index follows_follower_id_idx on follows(follower_id);
create index follows_following_id_idx on follows(following_id);
create index notifications_user_id_idx on notifications(user_id);
create index beats_versions_beat_id_idx on beats_versions(beat_id); 