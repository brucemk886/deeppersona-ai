"use client";

import { useState } from "react";
import {
  RELATIONSHIP_TYPES,
  type RelationshipNode,
  type RelationshipType,
} from "@/lib/relationship-network";

export function RelationshipNetwork({
  relationships,
  loading,
  onCreate,
  onExplore,
}: {
  relationships: RelationshipNode[];
  loading: boolean;
  onCreate: (nickname: string, relationshipType: RelationshipType) => Promise<boolean>;
  onExplore: (relationship: RelationshipNode) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [nickname, setNickname] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("partner");
  const [saving, setSaving] = useState(false);

  async function addRelationship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nickname.trim()) return;
    setSaving(true);
    const created = await onCreate(nickname.trim(), relationshipType);
    setSaving(false);
    if (created) {
      setNickname("");
      setAdding(false);
    }
  }

  return (
    <section className="relationship-network" aria-labelledby="relationship-network-title">
      <header className="relationship-network-heading">
        <div>
          <span>Your private relationship map</span>
          <h2 id="relationship-network-title">See how your connections feel from the inside.</h2>
          <p>Use a nickname only. This map reflects your experience in a relationship—it does not judge or diagnose the other person.</p>
        </div>
        <button className="relationship-add-button" onClick={() => setAdding((current) => !current)} type="button">
          {adding ? "Close" : "Add someone"} <span>＋</span>
        </button>
      </header>

      {adding ? (
        <form className="relationship-form" onSubmit={addRelationship}>
          <label htmlFor="relationship-nickname">What should we call this connection?</label>
          <input
            autoComplete="off"
            id="relationship-nickname"
            maxLength={48}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="e.g. Mom, Sam, my manager"
            required
            value={nickname}
          />
          <fieldset>
            <legend>Relationship type</legend>
            <div>
              {RELATIONSHIP_TYPES.map((type) => (
                <button
                  className={relationshipType === type.id ? "active" : ""}
                  key={type.id}
                  onClick={() => setRelationshipType(type.id)}
                  type="button"
                >
                  {type.label}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="primary-button" disabled={saving} type="submit">
            {saving ? "Adding…" : "Add to my map →"}
          </button>
        </form>
      ) : null}

      <div className="relationship-network-board">
        <div className="relationship-network-core">
          <span>YOU</span>
          <strong>{relationships.length}</strong>
          <small>{relationships.length === 1 ? "connection" : "connections"}</small>
        </div>
        {relationships.length ? (
          relationships.slice(0, 6).map((relationship, index) => (
            <article className={`relationship-network-node relationship-network-node-${index + 1}`} key={relationship.id}>
              <span>{RELATIONSHIP_TYPES.find((type) => type.id === relationship.relationshipType)?.label ?? "Connection"}</span>
              <h3>{relationship.nickname}</h3>
              <p>
                {relationship.reflectionCount
                  ? `${relationship.exploredDimensionIds.length}/6 dimensions explored · ${relationship.reflectionCount} reflection${relationship.reflectionCount === 1 ? "" : "s"}`
                  : "Ready for a first reflection"}
              </p>
              <button disabled={loading} onClick={() => onExplore(relationship)} type="button">
                {relationship.reflectionCount ? "Continue exploring →" : "Explore this connection →"}
              </button>
            </article>
          ))
        ) : (
          <div className="relationship-network-empty">
            <strong>Your map starts with one honest connection.</strong>
            <p>Add someone important using a nickname—no contacts, no real name required.</p>
          </div>
        )}
      </div>
      <p className="relationship-network-note">
        You can add, explore, and later remove individual connections. Nothing here is shared with the person you name.
      </p>
    </section>
  );
}
