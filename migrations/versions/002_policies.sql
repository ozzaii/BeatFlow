-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Beats policies
CREATE POLICY "Public beats are viewable by everyone"
    ON public.beats FOR SELECT
    USING (
        is_public = true OR 
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.collaborations
            WHERE beat_id = beats.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create beats"
    ON public.beats FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own beats or collaborations"
    ON public.beats FOR UPDATE
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.collaborations
            WHERE beat_id = beats.id
            AND user_id = auth.uid()
            AND role IN ('editor', 'owner')
        )
    );

CREATE POLICY "Users can delete their own beats"
    ON public.beats FOR DELETE
    USING (auth.uid() = owner_id);

-- Beats versions policies
CREATE POLICY "Beat versions are viewable by beat collaborators"
    ON public.beats_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.beats b
            LEFT JOIN public.collaborations c ON b.id = c.beat_id
            WHERE b.id = beats_versions.beat_id
            AND (
                b.owner_id = auth.uid() OR
                c.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Collaborators can create beat versions"
    ON public.beats_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.beats b
            LEFT JOIN public.collaborations c ON b.id = c.beat_id
            WHERE b.id = beat_id
            AND (
                b.owner_id = auth.uid() OR
                (c.user_id = auth.uid() AND c.role IN ('editor', 'owner'))
            )
        )
    );

-- Collaborations policies
CREATE POLICY "Collaborations are viewable by involved users"
    ON public.collaborations FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.beats
            WHERE id = beat_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Beat owners can manage collaborations"
    ON public.collaborations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.beats
            WHERE id = beat_id
            AND owner_id = auth.uid()
        )
    );

-- Comments policies
CREATE POLICY "Comments on public beats are viewable by everyone"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.beats
            WHERE id = beat_id
            AND (
                is_public = true OR
                owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.collaborations
                    WHERE beat_id = beats.id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create likes"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Public playlists are viewable by everyone"
    ON public.playlists FOR SELECT
    USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create playlists"
    ON public.playlists FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own playlists"
    ON public.playlists FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own playlists"
    ON public.playlists FOR DELETE
    USING (auth.uid() = owner_id);

-- Playlist items policies
CREATE POLICY "Playlist items are viewable by playlist viewers"
    ON public.playlist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE id = playlist_id
            AND (is_public = true OR owner_id = auth.uid())
        )
    );

CREATE POLICY "Playlist owners can manage items"
    ON public.playlist_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE id = playlist_id
            AND owner_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id); 