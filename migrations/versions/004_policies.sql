-- Enable Row Level Security
alter table profiles enable row level security;
alter table beats enable row level security;
alter table collaborations enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table follows enable row level security;
alter table notifications enable row level security;
alter table beats_versions enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using (true);

create policy "Users can insert their own profile"
    on profiles for insert
    with check (auth.uid() = id);

create policy "Users can update own profile"
    on profiles for update
    using (auth.uid() = id);

create policy "Public beats are viewable by everyone"
    on beats for select
    using (is_public = true or auth.uid() = created_by);

create policy "Authenticated users can create beats"
    on beats for insert
    with check (auth.uid() = created_by);

create policy "Users can update own beats"
    on beats for update
    using (auth.uid() = created_by);

create policy "Users can delete own beats"
    on beats for delete
    using (auth.uid() = created_by);

create policy "Collaborators can view beats"
    on beats for select
    using (
        exists (
            select 1 from collaborations
            where beat_id = id
            and user_id = auth.uid()
        )
    );

create policy "Collaborators can update beats"
    on beats for update
    using (
        exists (
            select 1 from collaborations
            where beat_id = id
            and user_id = auth.uid()
            and status = 'accepted'
            and role in ('editor', 'admin')
        )
    );

-- Comments policies
create policy "Comments are viewable by everyone"
    on comments for select
    using (true);

create policy "Authenticated users can create comments"
    on comments for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own comments"
    on comments for delete
    using (auth.uid() = user_id);

-- Likes policies
create policy "Likes are viewable by everyone"
    on likes for select
    using (true);

create policy "Authenticated users can create likes"
    on likes for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own likes"
    on likes for delete
    using (auth.uid() = user_id);

-- Follows policies
create policy "Follows are viewable by everyone"
    on follows for select
    using (true);

create policy "Authenticated users can create follows"
    on follows for insert
    with check (auth.uid() = follower_id);

create policy "Users can delete own follows"
    on follows for delete
    using (auth.uid() = follower_id);

-- Notifications policies
create policy "Users can view own notifications"
    on notifications for select
    using (auth.uid() = user_id);

create policy "System can create notifications"
    on notifications for insert
    with check (true);

-- Beats versions policies
create policy "Users can view versions of accessible beats"
    on beats_versions for select
    using (
        exists (
            select 1 from beats
            where id = beat_id
            and (
                is_public = true
                or created_by = auth.uid()
                or exists (
                    select 1 from collaborations
                    where beat_id = beats.id
                    and user_id = auth.uid()
                )
            )
        )
    );

create policy "Users can create versions of their beats"
    on beats_versions for insert
    with check (
        exists (
            select 1 from beats
            where id = beat_id
            and (
                created_by = auth.uid()
                or exists (
                    select 1 from collaborations
                    where beat_id = beats.id
                    and user_id = auth.uid()
                    and status = 'accepted'
                    and role in ('editor', 'admin')
                )
            )
        )
    );

-- Create real-time subscriptions
create publication supabase_realtime for table beats, comments, likes, notifications; 