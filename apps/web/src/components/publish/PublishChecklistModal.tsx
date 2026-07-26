'use client';



import { useI18n } from '@/i18n';

import { buildPublishChecklist, isPublishChecklistReady, type PublishCheckItem } from '@/lib/invitations/publish-checklist';

import { X, Loader2 } from 'lucide-react';



interface Props {

  open: boolean;

  onClose: () => void;

  onConfirm: () => void | Promise<void>;

  title: string;

  eventDate: string;

  eventPlace?: string | null;

  hasCouplePhoto?: boolean;

  hasProgram?: boolean;

  loading?: boolean;

}



export function PublishChecklistModal({

  open,

  onClose,

  onConfirm,

  title,

  eventDate,

  eventPlace,

  hasCouplePhoto = false,

  hasProgram = false,

  loading = false,

}: Props) {

  const { t } = useI18n();



  if (!open) return null;



  const items: PublishCheckItem[] = buildPublishChecklist({

    title,

    eventDate,

    eventPlace,

    hasCouplePhoto,

    hasProgram,

  });

  const ready = isPublishChecklistReady(items);



  return (

    <div

      

      

      onClick={(e) => e.target === e.currentTarget && onClose()}

    >

      <div

        

        

      >

        <button

          type="button"

          onClick={onClose}

          

          

        >

          <X size={18} />

        </button>



        <h2  >

          {t('invitation.publishCheck.title')}

        </h2>

        <p  >

          {t('invitation.publishCheck.subtitle')}

        </p>



        <ul >

          {items.map((item) => (

            <li

              key={item.id}

              

              

            >

              <span

                

                

              >

                {item.ok ? '✓' : '·'}

              </span>

              <span>

                {t(item.labelKey)}

                {item.required === false && (

                  <span  >

                    ({t('invitation.publishCheck.optional')})

                  </span>

                )}

              </span>

            </li>

          ))}

        </ul>



        <p  >

          {t('common.rsvpHintPublished')}

        </p>



        <div >

          <button

            type="button"

            onClick={onClose}

            

            

          >

            {t('common.cancel')}

          </button>

          <button

            type="button"

            disabled={!ready || loading}

            onClick={() => void onConfirm()}

            

            

          >

            {loading ? (

              <span >

                <Loader2  />

                {t('invitation.edit.saving')}

              </span>

            ) : (

              t('invitation.publishCheck.confirm')

            )}

          </button>

        </div>

      </div>

    </div>

  );

}

