-- Comments Feature Database Schema
-- This script creates tables for the commenting system on car listings

-- ========================================
-- 1. LISTING COMMENTS TABLE
-- ========================================
CREATE TABLE listing_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "listingId" UUID NOT NULL REFERENCES listing_details(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "parentCommentId" UUID REFERENCES listing_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    "isEdited" BOOLEAN DEFAULT false,
    "editedAt" TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMP,
    "deletedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "reactionCount" INTEGER DEFAULT 0,
    "replyCount" INTEGER DEFAULT 0,
    "isPinned" BOOLEAN DEFAULT false,
    "isReported" BOOLEAN DEFAULT false,
    "reportCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 2. COMMENT REACTIONS TABLE
-- ========================================
CREATE TABLE comment_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "commentId" UUID NOT NULL REFERENCES listing_comments(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "reactionType" VARCHAR(20) NOT NULL CHECK ("reactionType" IN ('like', 'helpful', 'thanks')),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("commentId", "userId")
);

-- ========================================
-- 3. COMMENT REPORTS TABLE
-- ========================================
CREATE TABLE comment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "commentId" UUID NOT NULL REFERENCES listing_comments(id) ON DELETE CASCADE,
    "reportedBy" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('spam', 'offensive', 'inappropriate', 'harassment', 'other')),
    description TEXT CHECK (length(description) <= 500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    "reviewedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "reviewedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Listing comments indexes
CREATE INDEX idx_listing_comments_listing_id ON listing_comments("listingId");
CREATE INDEX idx_listing_comments_user_id ON listing_comments("userId");
CREATE INDEX idx_listing_comments_parent_comment_id ON listing_comments("parentCommentId");
CREATE INDEX idx_listing_comments_created_at ON listing_comments("createdAt");
CREATE INDEX idx_listing_comments_is_deleted ON listing_comments("isDeleted");
CREATE INDEX idx_listing_comments_is_pinned ON listing_comments("isPinned");
CREATE INDEX idx_listing_comments_reaction_count ON listing_comments("reactionCount");

-- Comment reactions indexes
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions("commentId");
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions("userId");
CREATE INDEX idx_comment_reactions_type ON comment_reactions("reactionType");

-- Comment reports indexes
CREATE INDEX idx_comment_reports_comment_id ON comment_reports("commentId");
CREATE INDEX idx_comment_reports_reported_by ON comment_reports("reportedBy");
CREATE INDEX idx_comment_reports_status ON comment_reports(status);
CREATE INDEX idx_comment_reports_reason ON comment_reports(reason);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Apply trigger to listing_comments table
CREATE TRIGGER update_listing_comments_updated_at 
    BEFORE UPDATE ON listing_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCTIONS FOR CACHED COUNTS
-- ========================================

-- Function to update reaction count
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE listing_comments 
        SET "reactionCount" = "reactionCount" + 1 
        WHERE id = NEW."commentId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE listing_comments 
        SET "reactionCount" = "reactionCount" - 1 
        WHERE id = OLD."commentId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update reply count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only count direct replies (parentCommentId is not null)
        IF NEW."parentCommentId" IS NOT NULL THEN
            UPDATE listing_comments 
            SET "replyCount" = "replyCount" + 1 
            WHERE id = NEW."parentCommentId";
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Only count direct replies (parentCommentId is not null)
        IF OLD."parentCommentId" IS NOT NULL THEN
            UPDATE listing_comments 
            SET "replyCount" = "replyCount" - 1 
            WHERE id = OLD."parentCommentId";
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update report count
CREATE OR REPLACE FUNCTION update_comment_report_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE listing_comments 
        SET "reportCount" = "reportCount" + 1,
            "isReported" = true
        WHERE id = NEW."commentId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE listing_comments 
        SET "reportCount" = "reportCount" - 1,
            "isReported" = CASE 
                WHEN (SELECT COUNT(*) FROM comment_reports WHERE "commentId" = OLD."commentId") <= 1 
                THEN false 
                ELSE true 
            END
        WHERE id = OLD."commentId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- ========================================
-- TRIGGERS FOR CACHED COUNTS
-- ========================================

-- Reaction count triggers
CREATE TRIGGER update_reaction_count_on_insert
    AFTER INSERT ON comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reaction_count();

CREATE TRIGGER update_reaction_count_on_delete
    AFTER DELETE ON comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reaction_count();

-- Reply count triggers
CREATE TRIGGER update_reply_count_on_insert
    AFTER INSERT ON listing_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER update_reply_count_on_delete
    AFTER DELETE ON listing_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reply_count();

-- Report count triggers
CREATE TRIGGER update_report_count_on_insert
    AFTER INSERT ON comment_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_report_count();

CREATE TRIGGER update_report_count_on_delete
    AFTER DELETE ON comment_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_report_count();

-- ========================================
-- GRANTS
-- ========================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO carmarket_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO carmarket_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO carmarket_user;
